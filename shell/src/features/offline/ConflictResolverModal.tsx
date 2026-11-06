import React from 'react';
import { AlertTriangle, Check, GitMerge } from 'lucide-react';
import { useOfflineSync } from './useOfflineSync';

export const ConflictResolverModal: React.FC = () => {
  const { conflicts, resolveConflict } = useOfflineSync();

  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Conflicto de Concurrencia Optimista (OCC)
            </h3>
            <p className="text-xs text-slate-400">
              El registro de <strong>{currentConflict.entityType}</strong> fue modificado en el servidor mientras estabas sin conexión.
            </p>
          </div>
        </div>

        {/* Comparativa Lado a Lado */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-2">
              Tus Cambios Locales (v{currentConflict.clientVersion})
            </span>
            <pre className="text-xs bg-slate-950 p-3 rounded overflow-auto max-h-48 text-slate-300">
              {JSON.stringify(currentConflict.clientPayload, null, 2)}
            </pre>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">
              Versión en el Servidor (v{currentConflict.serverVersion})
            </span>
            <pre className="text-xs bg-slate-950 p-3 rounded overflow-auto max-h-48 text-slate-300">
              {JSON.stringify(currentConflict.serverPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Botones de Resolución */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => resolveConflict(currentConflict.conflictId, 'ACCEPT_SERVER')}
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition"
          >
            <Check size={14} />
            Aceptar Versión del Servidor
          </button>

          <button
            type="button"
            onClick={() => resolveConflict(currentConflict.conflictId, 'FORCE_CLIENT')}
            className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <GitMerge size={14} />
            Conservar Mis Cambios Locales
          </button>
        </div>
      </div>
    </div>
  );
};
