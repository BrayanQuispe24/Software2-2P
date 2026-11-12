import React from 'react';
import { AlertTriangle, Check, GitMerge, X } from 'lucide-react';
import { useOfflineSync } from './useOfflineSync';

export const ConflictResolverModal: React.FC = () => {
  const { conflicts, resolveConflict } = useOfflineSync();

  if (!conflicts || conflicts.length === 0) return null;

  const currentConflict = conflicts[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 16, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#222d35',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          maxWidth: '640px',
          width: '100%',
          padding: '1.75rem',
          color: '#ebf4dd',
          position: 'relative',
        }}
      >
        {/* Botón cerrar rápido */}
        <button
          type="button"
          onClick={() => resolveConflict(currentConflict.conflictId, 'ACCEPT_SERVER')}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#b6c7b5',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
          }}
          title="Descartar y cerrar"
        >
          <X size={18} />
        </button>

        {/* Header con icono */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              padding: '0.65rem',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ebf4dd', margin: 0, marginBottom: '0.25rem' }}>
              Conflicto de Concurrencia Optimista (OCC)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#b6c7b5', margin: 0, lineHeight: 1.4 }}>
              El registro de <strong style={{ color: '#fbbf24' }}>{currentConflict.entityType}</strong> ya existe o fue modificado en el servidor mientras estabas sin conexión.
            </p>
          </div>
        </div>

        {/* Comparativa Lado a Lado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Versión Local */}
          <div
            style={{
              background: 'rgba(24, 34, 40, 0.85)',
              border: '1px solid rgba(144, 171, 139, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#90ab8b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tus Cambios Locales
              </span>
              <span style={{ fontSize: '0.7rem', color: '#90ab8b', background: 'rgba(144, 171, 139, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                v{currentConflict.clientVersion}
              </span>
            </div>
            <pre
              style={{
                fontSize: '0.75rem',
                background: '#182228',
                padding: '0.75rem',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '180px',
                color: '#ebf4dd',
                margin: 0,
                border: '1px solid rgba(144, 171, 139, 0.1)',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(currentConflict.clientPayload, null, 2)}
            </pre>
          </div>

          {/* Versión Servidor */}
          <div
            style={{
              background: 'rgba(24, 34, 40, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Versión en el Servidor
              </span>
              <span style={{ fontSize: '0.7rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                v{currentConflict.serverVersion}
              </span>
            </div>
            <pre
              style={{
                fontSize: '0.75rem',
                background: '#182228',
                padding: '0.75rem',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '180px',
                color: '#b6c7b5',
                margin: 0,
                border: '1px solid rgba(59, 130, 246, 0.1)',
                fontFamily: 'monospace',
              }}
            >
              {Object.keys(currentConflict.serverPayload || {}).length > 0
                ? JSON.stringify(currentConflict.serverPayload, null, 2)
                : '// Registro ya existe en el servidor con los mismos identificadores (CI / Email)'}
            </pre>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(144, 171, 139, 0.15)' }}>
          <button
            type="button"
            onClick={() => resolveConflict(currentConflict.conflictId, 'ACCEPT_SERVER')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(36, 46, 53, 0.9)',
              border: '1px solid var(--border-color)',
              color: '#ebf4dd',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'background 0.2s',
            }}
          >
            <Check size={16} />
            Aceptar Versión del Servidor
          </button>

          <button
            type="button"
            onClick={() => resolveConflict(currentConflict.conflictId, 'FORCE_CLIENT')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: '#5a7863',
              border: '1px solid #90ab8b',
              color: '#ebf4dd',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'background 0.2s',
            }}
          >
            <GitMerge size={16} />
            Conservar Mis Cambios Locales
          </button>
        </div>
      </div>
    </div>
  );
};

