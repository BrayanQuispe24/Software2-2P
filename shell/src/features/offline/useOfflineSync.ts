import { useState, useEffect, useCallback } from 'react';
import { getSyncEngine } from '../../shared/sync-core';
import type { SyncEngineStatus } from '../../shared/sync-core';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncEngineStatus>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    conflicts: [],
  });

  useEffect(() => {
    const engine = getSyncEngine();
    const unsubscribe = engine.subscribe((newStatus: SyncEngineStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = useCallback(async () => {
    const engine = getSyncEngine();
    await engine.syncQueue();
  }, []);

  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: 'FORCE_CLIENT' | 'ACCEPT_SERVER' | 'MANUAL_MERGE',
      mergedPayload?: any
    ) => {
      const engine = getSyncEngine();
      await engine.resolveConflict(conflictId, strategy, mergedPayload);
    },
    []
  );

  return {
    ...status,
    syncNow,
    resolveConflict,
  };
}
