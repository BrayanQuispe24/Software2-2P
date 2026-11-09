import type { OutboxOperation, CachedEntity, SyncConflict } from './types';
import { ClientCrypto } from './crypto';

const DB_VERSION = 1;

export class OfflineStorageDB {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(userId: string = 'global_user') {
    this.dbName = `apex_offline_db_${userId}`;
  }

  public async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: outbox (cola de mutaciones)
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'localId' });
          outboxStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          outboxStore.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
          outboxStore.createIndex('entityType', 'entityType', { unique: false });
          outboxStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        }

        // Store 2: cached_entities (lectura local offline)
        if (!db.objectStoreNames.contains('cached_entities')) {
          const cacheStore = db.createObjectStore('cached_entities', { keyPath: 'id' });
          cacheStore.createIndex('entityType', 'entityType', { unique: false });
          cacheStore.createIndex('lastSyncedAt', 'lastSyncedAt', { unique: false });
        }

        // Store 3: sync_conflicts (conflictos OCC)
        if (!db.objectStoreNames.contains('sync_conflicts')) {
          const conflictStore = db.createObjectStore('sync_conflicts', { keyPath: 'conflictId' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
          conflictStore.createIndex('localId', 'localId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Error abriendo IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('OfflineStorageDB no ha sido inicializado. Llama a init() primero.');
    }
    return this.db;
  }

  // --- Operaciones OUTBOX ---

  public async addOutboxOperation(operation: OutboxOperation): Promise<void> {
    await this.init();
    const db = this.getDB();

    // Cifrar el payload sensible antes de persistir
    const encryptedPayload = await ClientCrypto.encryptPayload(operation.payload);
    const storedRecord = {
      ...operation,
      payload: encryptedPayload as any,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.put(storedRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingOperations(): Promise<OutboxOperation[]> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const statusIndex = store.index('syncStatus');
      const request = statusIndex.getAll('PENDING');

      request.onsuccess = async () => {
        const rawList = (request.result || []) as OutboxOperation[];
        // Descifrar payloads
        const decryptedList: OutboxOperation[] = [];
        for (const item of rawList) {
          const payload = typeof item.payload === 'string'
            ? await ClientCrypto.decryptPayload(item.payload as unknown as string)
            : item.payload;
          decryptedList.push({ ...item, payload });
        }
        // Ordenar por clientTimestamp ascendente
        decryptedList.sort((a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime());
        resolve(decryptedList);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async countPendingOperations(): Promise<number> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const statusIndex = store.index('syncStatus');
      const request = statusIndex.count('PENDING');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async updateOperationStatus(
    localId: string,
    status: OutboxOperation['syncStatus'],
    extra?: { serverId?: string; lastError?: string }
  ): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const getReq = store.get(localId);

      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) return resolve();

        record.syncStatus = status;
        if (extra?.serverId) record.serverId = extra.serverId;
        if (extra?.lastError) {
          record.lastError = extra.lastError;
          record.retryCount = (record.retryCount || 0) + 1;
        }

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- Operaciones CONFLICTOS ---

  public async addConflict(conflict: SyncConflict): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_conflicts', 'readwrite');
      const store = tx.objectStore('sync_conflicts');
      const request = store.put(conflict);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getUnresolvedConflicts(): Promise<SyncConflict[]> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_conflicts', 'readonly');
      const store = tx.objectStore('sync_conflicts');
      const request = store.getAll();

      request.onsuccess = () => {
        const all = (request.result || []) as SyncConflict[];
        resolve(all.filter((c) => !c.resolved));
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async markConflictResolved(conflictId: string): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_conflicts', 'readwrite');
      const store = tx.objectStore('sync_conflicts');
      const getReq = store.get(conflictId);

      getReq.onsuccess = () => {
        const item = getReq.result as SyncConflict;
        if (item) {
          item.resolved = true;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- Almacén de Lectura Local CACHED ENTITIES ---

  public async cacheEntity(entity: CachedEntity): Promise<void> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_entities', 'readwrite');
      const store = tx.objectStore('cached_entities');
      const request = store.put(entity);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getCachedEntity(id: string): Promise<CachedEntity | null> {
    await this.init();
    const db = this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_entities', 'readonly');
      const store = tx.objectStore('cached_entities');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}
