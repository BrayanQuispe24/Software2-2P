import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CloudOff } from 'lucide-react';
import { useOfflineSync } from './useOfflineSync';
import './connectivity.css';

export const ConnectivityBanner: React.FC = () => {
  const { isOnline, pendingCount, conflicts } = useOfflineSync();

  return (
    <>
      {/* Alerta flotante cuando el sistema pasa a modo Offline */}
      {!isOnline && (
        <div className="offline-floating-banner" role="alert">
          <div className="offline-banner-content">
            <CloudOff size={18} className="banner-icon animate-pulse" />
            <span>
              <strong>Modo Autónomo Offline:</strong> No hay conexión a internet. Tus registros se están guardando localmente y se sincronizarán al reconectar.
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="offline-banner-badge">
              {pendingCount} {pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
            </span>
          )}
        </div>
      )}

      {/* Alerta de conflictos OCC pendientes si existen */}
      {conflicts.length > 0 && (
        <div className="conflict-alert-banner" role="alert">
          <AlertTriangle size={18} className="text-amber-400" />
          <span>
            Se han detectado <strong>{conflicts.length} conflicto(s)</strong> de concurrencia optimista al sincronizar.
          </span>
        </div>
      )}
    </>
  );
};

export const ConnectivityPill: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  return (
    <div className="connectivity-pill-container">
      {/* Indicador de conexión */}
      <div
        className={`status-pill ${isOnline ? 'status-pill-online' : 'status-pill-offline'}`}
        title={isOnline ? 'Conexión estable con el Gateway' : 'Trabajando en modo local (Offline)'}
      >
        {isOnline ? (
          <>
            <span className="status-dot-pulse bg-emerald-500" />
            <Wifi size={13} className="text-emerald-400" />
            <span className="pill-text">En Línea</span>
          </>
        ) : (
          <>
            <span className="status-dot-pulse bg-amber-500" />
            <WifiOff size={13} className="text-amber-400" />
            <span className="pill-text">Sin Conexión</span>
          </>
        )}
      </div>

      {/* Contador de cambios pendientes */}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => isOnline && !isSyncing && syncNow()}
          disabled={!isOnline || isSyncing}
          className={`pending-sync-btn ${isSyncing ? 'syncing' : ''}`}
          title={isOnline ? 'Hacer clic para forzar sincronización ahora' : 'Sincronización pendiente de red'}
        >
          <RefreshCw size={13} className={`sync-icon ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{pendingCount} pend.</span>
        </button>
      )}
    </div>
  );
};
