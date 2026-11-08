import { getSyncEngine } from '../index';
import type { SyncEngineStatus } from '../index';

/**
 * Adaptador ligero para Angular y aplicaciones TypeScript puras.
 * Puede ser utilizado directamente en servicios Angular (@Injectable).
 */
export class AngularSyncAdapter {
  private engine = getSyncEngine();

  public subscribeStatus(callback: (status: SyncEngineStatus) => void): () => void {
    return this.engine.subscribe(callback);
  }

  public async getStatus(): Promise<SyncEngineStatus> {
    return this.engine.getStatus();
  }

  public isOnline(): boolean {
    return (window as any).__APEX_SYNC_ENGINE__?.heartbeat?.isOnline() ?? navigator.onLine;
  }

  public async enqueue(params: {
    entityType: string;
    operationType: 'CREATE' | 'UPDATE' | 'DELETE';
    endpoint: string;
    httpMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: Record<string, any>;
    baseVersion?: number;
  }) {
    return this.engine.enqueueMutation(params);
  }

  public async syncNow() {
    return this.engine.syncQueue();
  }

  public async resolveConflict(
    conflictId: string,
    strategy: 'FORCE_CLIENT' | 'ACCEPT_SERVER' | 'MANUAL_MERGE',
    mergedPayload?: any
  ) {
    return this.engine.resolveConflict(conflictId, strategy, mergedPayload);
  }
}
