/**
 * Coordinador Multi-Pestaña usando Web Locks API y BroadcastChannel.
 * Evita que múltiples pestañas procesen la cola de sincronización concurrentemente.
 */

export interface BroadcastSyncMessage {
  type: 'QUEUE_UPDATED' | 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'CONFLICT_DETECTED';
  payload?: any;
}

export class LockAndChannelManager {
  private channel: BroadcastChannel | null = null;
  private channelName: string;
  private lockName: string;

  constructor(channelName = 'apex_sync_channel', lockName = 'apex_sync_queue_lock') {
    this.channelName = channelName;
    this.lockName = lockName;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(this.channelName);
    }
  }

  /**
   * Ejecuta una tarea asegurando exclusividad entre todas las pestañas abiertas.
   */
  public async withLock<T>(task: () => Promise<T>): Promise<T | null> {
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      return (navigator as any).locks.request(
        this.lockName,
        { ifAvailable: true },
        async (lock: any) => {
          if (!lock) {
            // Otra pestaña ya tiene el lock de sincronización
            return null;
          }
          return await task();
        }
      );
    }

    // Fallback simple si Web Locks no está soportado
    return await task();
  }

  /**
   * Difunde un mensaje a todas las demás pestañas abiertas.
   */
  public broadcast(message: BroadcastSyncMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[BroadcastChannel] Error publicando mensaje:', err);
      }
    }
  }

  /**
   * Se suscribe a los mensajes emitidos por otras pestañas.
   */
  public onMessage(callback: (msg: BroadcastSyncMessage) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (event: MessageEvent) => {
      callback(event.data);
    };

    this.channel.addEventListener('message', handler);
    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }

  public close(): void {
    this.channel?.close();
  }
}

