import { SyncCoreEngine } from './sync-engine';
export type * from './types';
export * from './crypto';
export * from './db';
export * from './heartbeat';
export * from './lock-manager';
export * from './sync-engine';

// Declaración global para interoperabilidad en microfrontends
declare global {
  interface Window {
    __APEX_SYNC_ENGINE__?: SyncCoreEngine;
  }
}

let syncEngineInstance: SyncCoreEngine | null = null;

export function getSyncEngine(userId = 'global_user'): SyncCoreEngine {
  if (typeof window !== 'undefined') {
    if (!window.__APEX_SYNC_ENGINE__) {
      window.__APEX_SYNC_ENGINE__ = new SyncCoreEngine(userId);
    }
    return window.__APEX_SYNC_ENGINE__;
  }

  if (!syncEngineInstance) {
    syncEngineInstance = new SyncCoreEngine(userId);
  }
  return syncEngineInstance;
}

