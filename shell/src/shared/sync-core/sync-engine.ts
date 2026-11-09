import type { OutboxOperation, SyncConflict, SyncEngineStatus, SyncStatusListener } from './types';
import { OfflineStorageDB } from './db';
import { HeartbeatMonitor } from './heartbeat';
import { LockAndChannelManager } from './lock-manager';

export class SyncCoreEngine {
  private db: OfflineStorageDB;
  private heartbeat: HeartbeatMonitor;
  private lockManager: LockAndChannelManager;
  private listeners: Set<SyncStatusListener> = new Set();
  private isSyncing = false;
  private lastSyncedAt: Date | null = null;
  private currentUserId = 'global_user';

  constructor(userId = 'global_user') {
    this.currentUserId = userId;
    this.db = new OfflineStorageDB(userId);
    this.heartbeat = new HeartbeatMonitor();
    this.lockManager = new LockAndChannelManager();

    this.init();
  }

  private async init() {
    await this.db.init();

    // Iniciar monitor de conectividad
    this.heartbeat.subscribe(async (isOnline) => {
      this.notifyListeners();
      if (isOnline) {
        // Al regresar la red, disparar el vaciado de la cola automáticamente
        await this.syncQueue();
      }
    });
    this.heartbeat.start();

    // Escuchar mensajes de otras pestañas
    this.lockManager.onMessage(async (msg) => {
      if (msg.type === 'QUEUE_UPDATED' || msg.type === 'SYNC_COMPLETED') {
        this.notifyListeners();
      }
    });

    this.notifyListeners();
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    this.getStatus().then((status) => listener(status));
    return () => this.listeners.delete(listener);
  }

  public async getStatus(): Promise<SyncEngineStatus> {
    const pendingCount = await this.db.countPendingOperations();
    const conflicts = await this.db.getUnresolvedConflicts();

    return {
      isOnline: this.heartbeat.isOnline(),
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      conflicts,
    };
  }

  private async notifyListeners() {
    const status = await this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(status);
      } catch (e) {
        console.error('[SyncEngine] Error notificando listener:', e);
      }
    });
  }

  /**
   * Encola una mutación local de forma optimista.
   */
  public async enqueueMutation(params: {
    entityType: string;
    operationType: 'CREATE' | 'UPDATE' | 'DELETE';
    endpoint: string;
    httpMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: Record<string, any>;
    baseVersion?: number;
  }): Promise<{ localId: string; isOptimistic: boolean }> {
    const localId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();

    const op: OutboxOperation = {
      localId,
      entityType: params.entityType,
      operationType: params.operationType,
      endpoint: params.endpoint,
      httpMethod: params.httpMethod,
      payload: params.payload,
      idempotencyKey,
      clientTimestamp: new Date().toISOString(),
      baseVersion: params.baseVersion || 1,
      syncStatus: 'PENDING',
      retryCount: 0,
      userId: this.currentUserId,
    };

    // Guardar en la base de datos local
    await this.db.addOutboxOperation(op);

    // Guardar en caché local de entidades para lectura inmediata
    await this.db.cacheEntity({
      id: localId,
      entityType: params.entityType,
      data: { ...params.payload, id: localId },
      version: op.baseVersion,
      lastSyncedAt: op.clientTimestamp,
      isLocalOnly: true,
    });

    this.lockManager.broadcast({ type: 'QUEUE_UPDATED' });
    this.notifyListeners();

    // Si hay conexión, intentar sincronizar de inmediato
    if (this.heartbeat.isOnline()) {
      this.syncQueue();
    }

    return { localId, isOptimistic: !this.heartbeat.isOnline() };
  }

  /**
   * Procesa la cola de operaciones pendientes garantizando exclusividad y no-duplicación.
   */
  public async syncQueue(): Promise<void> {
    if (!this.heartbeat.isOnline() || this.isSyncing) return;

    await this.lockManager.withLock(async () => {
      this.isSyncing = true;
      this.lockManager.broadcast({ type: 'SYNC_STARTED' });
      this.notifyListeners();

      try {
        const pendingOps = await this.db.getPendingOperations();

        for (const op of pendingOps) {
          // Si la red se cortó en medio del proceso, suspender
          if (!this.heartbeat.isOnline()) break;

          await this.db.updateOperationStatus(op.localId, 'SYNCING');

          try {
            const result = await this.dispatchOperation(op);

            if (result.success) {
              await this.db.updateOperationStatus(op.localId, 'SYNCED', {
                serverId: result.serverId,
              });
            } else if (result.isConflict) {
              await this.db.updateOperationStatus(op.localId, 'CONFLICT');
              const conflictRecord: SyncConflict = {
                conflictId: crypto.randomUUID(),
                localId: op.localId,
                entityType: op.entityType,
                clientVersion: op.baseVersion,
                serverVersion: result.serverVersion || op.baseVersion + 1,
                clientPayload: op.payload,
                serverPayload: result.serverState || {},
                detectedAt: new Date().toISOString(),
                resolved: false,
              };
              await this.db.addConflict(conflictRecord);
              this.lockManager.broadcast({ type: 'CONFLICT_DETECTED', payload: conflictRecord });
            } else {
              await this.db.updateOperationStatus(op.localId, 'PENDING', {
                lastError: result.error,
              });
              // Esperar con backoff antes del siguiente intento
              await this.delayBackoff(op.retryCount);
            }
          } catch (err: any) {
            await this.db.updateOperationStatus(op.localId, 'PENDING', {
              lastError: err?.message || 'Error de red',
            });
            break;
          }
        }
      } finally {
        this.isSyncing = false;
        this.lastSyncedAt = new Date();
        this.lockManager.broadcast({ type: 'SYNC_COMPLETED' });
        this.notifyListeners();
      }
    });
  }

  /**
   * Envía una operación individual al API Gateway con X-Idempotency-Key.
   */
  private async dispatchOperation(op: OutboxOperation): Promise<{
    success: boolean;
    serverId?: string;
    isConflict?: boolean;
    serverVersion?: number;
    serverState?: any;
    error?: string;
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': op.idempotencyKey,
      'X-Entity-Version': String(op.baseVersion),
    };

    const response = await fetch(op.endpoint, {
      method: op.httpMethod,
      headers,
      body: op.httpMethod !== 'DELETE' ? JSON.stringify(op.payload) : undefined,
      credentials: 'include',
    });

    if (response.status === 409) {
      // Concurrencia Optimista (OCC)
      let body: any = {};
      try {
        body = await response.json();
      } catch {}
      return {
        success: false,
        isConflict: true,
        serverVersion: body.serverVersion,
        serverState: body.serverState || body.serverDocument,
      };
    }

    if (response.ok || response.status === 201 || response.status === 200) {
      let body: any = {};
      try {
        body = await response.json();
      } catch {}
      return {
        success: true,
        serverId: body.id || body._id || body.serverId,
      };
    }

    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  /**
   * Exponential Backoff con Jitter aleatorio.
   */
  private async delayBackoff(retryCount: number): Promise<void> {
    const baseDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    const jitter = Math.random() * 500;
    const finalDelay = baseDelay + jitter;
    return new Promise((resolve) => setTimeout(resolve, finalDelay));
  }

  /**
   * Resuelve un conflicto manualmente.
   */
  public async resolveConflict(
    conflictId: string,
    strategy: 'FORCE_CLIENT' | 'ACCEPT_SERVER' | 'MANUAL_MERGE',
    mergedPayload?: any
  ): Promise<void> {
    const conflicts = await this.db.getUnresolvedConflicts();
    const conflict = conflicts.find((c) => c.conflictId === conflictId);
    if (!conflict) return;

    if (strategy === 'FORCE_CLIENT' || strategy === 'MANUAL_MERGE') {
      const payloadToPush = strategy === 'MANUAL_MERGE' ? mergedPayload : conflict.clientPayload;
      await this.enqueueMutation({
        entityType: conflict.entityType,
        operationType: 'UPDATE',
        endpoint: `/api/${conflict.entityType.toLowerCase()}s/${conflict.localId}`,
        httpMethod: 'PUT',
        payload: payloadToPush,
        baseVersion: conflict.serverVersion,
      });
    }

    await this.db.markConflictResolved(conflictId);
    this.notifyListeners();
  }
}
