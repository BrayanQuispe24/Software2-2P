/**
 * Monitor de conectividad real mediante Heartbeat Ping al API Gateway.
 * Detecta portales cautivos, DNS caídos y caídas del backend.
 */

export type ConnectivityCallback = (isOnline: boolean) => void;

export class HeartbeatMonitor {
  private isOnlineState: boolean = true;
  private intervalId: any = null;
  private pingUrl: string;
  private pingIntervalMs: number;
  private timeoutMs: number;
  private listeners: Set<ConnectivityCallback> = new Set();

  constructor(options?: { pingUrl?: string; pingIntervalMs?: number; timeoutMs?: number }) {
    this.pingUrl = options?.pingUrl || '/api/health/ping';
    this.pingIntervalMs = options?.pingIntervalMs || 20000; // 20s
    this.timeoutMs = options?.timeoutMs || 3500; // 3.5s timeout
    this.isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public start(): void {
    if (typeof window === 'undefined') return;

    // Escuchar eventos estándar del navegador para comprobación inmediata
    window.addEventListener('online', () => this.checkConnectivity(true));
    window.addEventListener('offline', () => this.updateStatus(false));

    // Ejecutar chequeo inicial
    this.checkConnectivity();

    // Iniciar intervalo periódico adaptativo
    this.intervalId = setInterval(() => {
      this.checkConnectivity();
    }, this.pingIntervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public subscribe(cb: ConnectivityCallback): () => void {
    this.listeners.add(cb);
    cb(this.isOnlineState);
    return () => this.listeners.delete(cb);
  }

  /**
   * Realiza un ping real tipo HEAD al backend.
   */
  public async checkConnectivity(forceNotify = false): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.pingUrl}?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const isReachable = response.ok || response.status === 204 || response.status === 200;
      this.updateStatus(isReachable, forceNotify);
      return isReachable;
    } catch {
      clearTimeout(timeout);
      this.updateStatus(false, forceNotify);
      return false;
    }
  }

  private updateStatus(newStatus: boolean, force = false): void {
    if (this.isOnlineState !== newStatus || force) {
      this.isOnlineState = newStatus;
      this.listeners.forEach((listener) => {
        try {
          listener(this.isOnlineState);
        } catch (e) {
          console.error('[Heartbeat] Error en listener de conectividad:', e);
        }
      });
    }
  }
}

