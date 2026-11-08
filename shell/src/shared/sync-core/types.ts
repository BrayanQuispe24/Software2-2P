export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface OutboxOperation {
  localId: string;               // UUID v4 generado en cliente
  serverId?: string;             // ID definitivo en backend
  entityType: string;            // 'ENTRENAMIENTO' | 'EVALUACION' | 'ASISTENCIA' | 'INVENTARIO' | 'USUARIO'
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;              // Ruta en Gateway (ej. /api/entrenamientos)
  httpMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, any>;  // Datos JSON (cifrados en reposo)
  idempotencyKey: string;        // UUID v4 único e inmutable
  clientTimestamp: string;       // ISO 8601
  baseVersion: number;           // Versión OCC base
  syncStatus: SyncStatus;
  retryCount: number;
  lastError?: string;
  userId: string;
}

export interface CachedEntity {
  id: string;                    // localId o serverId
  entityType: string;
  data: Record<string, any>;
  version: number;
  lastSyncedAt: string;
  isLocalOnly: boolean;
}

export interface SyncConflict {
  conflictId: string;
  localId: string;
  entityType: string;
  clientVersion: number;
  serverVersion: number;
  clientPayload: any;
  serverPayload: any;
  detectedAt: string;
  resolved: boolean;
  resolutionStrategy?: 'MANUAL_MERGE' | 'FORCE_CLIENT' | 'ACCEPT_SERVER';
}

export interface SyncEngineStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  conflicts: SyncConflict[];
}

export type SyncStatusListener = (status: SyncEngineStatus) => void;

