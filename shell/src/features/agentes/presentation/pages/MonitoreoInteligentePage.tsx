import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import {
  Activity,
  ShieldAlert,
  CheckCircle,
  Layers,
  RefreshCw,
  Terminal,
  Check,
} from 'lucide-react';
import type { AlertaData } from '../../infrastructure/alertaData';
import '../styles/monitoreo-inteligente.css';
import { formatAlertCondition } from '../formatAlertCondition';
import { RuleEditor } from '../components/RuleEditor';
import { useSessionQuery } from '../../../auth/presentation/hooks/useSessionQuery';

const LocalAiPanel = lazy(() => import('../components/LocalAiPanel').then((module) => ({ default: module.LocalAiPanel })));

interface AgentAction {
  id: string;
  alerta_id: string;
  tipo_accion: string;
  estado: string;
  nivel_autonomia: number;
  resultado?: string | null;
  propuesta?: string | null;
  regla_id?: string | null;
  motivo_bloqueo?: string | null;
  puede_despachar?: boolean;
}

interface DashboardSummary {
  datos_iniciales_cargados?: boolean;
  monitoreo_activo: boolean;
  fuentes: { nombre: string; disponible: boolean; motivo?: string }[];
  aforo_actual_pct: number | null;
  aforo_presentes: number | null;
  aforo_capacidad: number | null;
  alertas_abiertas: number;
  alertas_criticas: number;
  reglas_activas: number;
  agentes: { id: string; tipo: string; nombre: string; activo: boolean; nivel_autonomia: number }[];
  metricas_validacion: {
    precision_alertas_pct: number | null;
    tasa_falsas_alarmas_pct: number | null;
    latencia_media_segundos: number | null;
    acciones_sensibles_no_autorizadas: number;
    duplicados_indebidos: number | null;
    total_alertas_historicas: number;
    alertas_resueltas: number;
  };
}

export const MonitoreoInteligentePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitoreo' | 'reglas' | 'herramientas'>('monitoreo');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alertas, setAlertas] = useState<AlertaData[]>([]);
  const [alreadySeeded, setAlreadySeeded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_agent_data_seeded') === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRule, setEditingRule] = useState<any>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [busyActions, setBusyActions] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const submitAction = async (action: AgentAction, operation: 'autorizar' | 'ejecutar', body?: object) => {
    if (busyActions[action.id]) return;
    setBusyActions((previous) => ({ ...previous, [action.id]: true }));
    setActionErrors((previous) => ({ ...previous, [action.id]: '' }));
    try {
      await axios.post(`/api/agentes/acciones/${action.id}/${operation}`, body);
      await fetchData();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setActionErrors((previous) => ({ ...previous, [action.id]: typeof detail === 'string' ? detail : 'No se pudo procesar la acción. Inténtalo más tarde.' }));
    } finally {
      setBusyActions((previous) => ({ ...previous, [action.id]: false }));
    }
  };
  const groupedActions = Array.from(actions.reduce<Map<string, AgentAction & { repeticiones: number }>>((groups, action) => {
    // Keep independent proposals separate; collapse repeated informational events per alert.
    const key = action.nivel_autonomia === 4 ? action.id :
      JSON.stringify([action.alerta_id, action.tipo_accion, action.estado, action.resultado, action.propuesta]);
    const group = groups.get(key);
    if (group) group.repeticiones += 1;
    else groups.set(key, { ...action, repeticiones: 1 });
    return groups;
  }, new Map()).values());
  const actionLabels: Record<string, string> = {
    NOTIFICACION_INTERNA_DASHBOARD: 'Aviso en el panel',
    RECOMENDAR_PLAN_ACCION: 'Recomendación',
    DESPACHAR_WEBHOOK_N8N: 'Notificación al workflow',
    MODIFICAR_POLITICA_O_CAMPANA_SENSIBLE: 'Propuesta que requiere aprobación',
  };
  const { data: session } = useSessionQuery();
  const isAdmin = session?.user.roles.includes('ADMINISTRADOR') ?? false;
  // Reglas
  const [reglas, setReglas] = useState<any[]>([]);

  // Consola de Herramientas
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [executingTool, setExecutingTool] = useState(false);

  // Historial
  const [historial, setHistorial] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, alertRes, regRes, histRes, actionRes] = await Promise.all([
        axios.get('/api/agentes/dashboard/summary'),
        axios.get('/api/agentes/alertas'),
        axios.get('/api/agentes/reglas'),
        axios.get('/api/agentes/historial?limit=20'),
        axios.get('/api/agentes/acciones'),
      ]);
      setSummary(sumRes.data);
      setAlertas(alertRes.data);
      setReglas(regRes.data);
      setHistorial(histRes.data);
      setActions(actionRes.data);
      if (sumRes.data?.datos_iniciales_cargados || alertRes.data?.length > 0) {
        setAlreadySeeded(true);
        try { localStorage.setItem('apex_agent_data_seeded', 'true'); } catch {}
      }
      setError('');
    } catch (e) {
      console.warn('Error al cargar datos de ms-agentes:', e);
      setError('No se pudieron actualizar los datos del monitoreo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateEstadoAlerta = async (id: string, nuevoEstado: string) => {
    try {
      await axios.patch(`/api/agentes/alertas/${id}/estado`, {
        estado: nuevoEstado,
        motivo: 'Acción manual tomada en el Centro de Monitoreo Inteligente',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteTool = async (toolName: string, params: Record<string, any> = {}) => {
    setExecutingTool(true);
    try {
      const response = await axios.post('/api/agentes/tools/execute', { tool_name: toolName, params });
      const res = response.data;
      setToolOutput(res);
    } catch (err: any) {
      setToolOutput({ error: err.message });
    } finally {
      setExecutingTool(false);
    }
  };

  return (
    <div className="monitoreo-container">
      {/* Topbar Fija con Header, Local AI y Tabs */}
      <div className="monitoreo-topbar">
        <div className="monitoreo-header-row">
          <div className="monitoreo-title">
            <h1>
              <Activity color="#6ee7b7" size={26} />
              Centro de monitoreo
            </h1>
            <p>
              Consulta la actividad del gimnasio, atiende alertas y revisa las reglas de monitoreo.
            </p>
          </div>
          <div className="monitoreo-actions">
            <div className="status-badge-active">
              <span className="status-dot-pulse" />
              {summary ? (summary.monitoreo_activo ? 'Monitoreo activo' : 'Monitoreo inactivo') : 'Conectando…'}
            </div>
            <button className="btn-secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button className="btn-secondary" disabled={loading} onClick={async () => {
              setLoading(true);
              try { await axios.post('/api/agentes/evaluaciones/ejecutar', {}); await fetchData(); }
              catch { setError('La evaluación no pudo completarse.'); }
              finally { setLoading(false); }
            }}>Evaluar datos actuales</button>
            {!alreadySeeded && !summary?.datos_iniciales_cargados && alertas.length === 0 && (
              <button className="btn-secondary" disabled={loading} onClick={async () => {
                setLoading(true);
                try {
                  const res = await axios.post('/api/agentes/seed-data');
                  if (res.data?.already_seeded) {
                    setError('Los datos ya fueron cargados previamente.');
                  }
                  setAlreadySeeded(true);
                  try { localStorage.setItem('apex_agent_data_seeded', 'true'); } catch {}
                  await fetchData();
                } catch {
                  setError('No se pudieron cargar los datos reales en el agente.');
                } finally {
                  setLoading(false);
                }
              }}>
                Cargar datos reales
              </button>
            )}
          </div>
        </div>

        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'monitoreo' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoreo')}
          >
            <Activity size={16} />
            Monitoreo y alertas
          </button>

          <button
            className={`tab-btn ${activeTab === 'reglas' ? 'active' : ''}`}
            onClick={() => setActiveTab('reglas')}
          >
            <Layers size={16} />
            Reglas
          </button>
          <button
            className={`tab-btn ${activeTab === 'herramientas' ? 'active' : ''}`}
            onClick={() => setActiveTab('herramientas')}
          >
            <Terminal size={16} />
            Consultas e historial
          </button>
        </div>
      </div>

      {/* Viewport Desplazable */}
      <div className="monitoreo-viewport">
      {error && <p role="alert">{error}</p>}

      {/* PESTAÑA 1: MONITOREO Y ALERTAS */}
      {activeTab === 'monitoreo' && (
        <>
          <Suspense fallback={<p>Cargando herramientas de IA local?</p>}>
            <LocalAiPanel alerts={alertas} onSaved={fetchData} />
          </Suspense>
          {summary?.fuentes?.some((source) => !source.disponible) && <div className="local-ai-panel">
            <h3>Fuentes sin datos disponibles</h3>
            {summary.fuentes.filter((source) => !source.disponible).map((source) =>
              <p key={source.nombre}><strong>{source.nombre}</strong>: {source.motivo ?? 'Sin registros suficientes o lectura desactualizada'}</p>)}
          </div>}
          {/* Tarjetas KPI */}
          <div className="kpi-cards-grid">
            <div className="kpi-card" style={{ borderLeft: '4px solid #eab308' }}>
              <div className="kpi-card-header">
                <span>OCUPACIÓN ACTUAL</span>
                <Activity size={18} />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.aforo_actual_pct != null ? `${summary.aforo_actual_pct}%` : 'Sin datos'}</span>
                <span className="kpi-subtext">
                  ({summary?.aforo_presentes ?? '—'} / {summary?.aforo_capacidad ?? '—'} plazas)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {reglas.find((r) => r.agente_tipo === 'AFORO' && r.activa)
                  ? `Umbral preventivo: ${reglas.find((r) => r.agente_tipo === 'AFORO' && r.activa).umbral_preventivo}%`
                  : 'Sin regla de aforo activa'}
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="kpi-card-header">
                <span>ALERTAS ABIERTAS</span>
                <ShieldAlert size={18} color="#ef4444" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.alertas_abiertas ?? '—'}</span>
                <span className="kpi-subtext" style={{ color: '#fca5a5' }}>
                  ({summary?.alertas_criticas ?? '—'} críticas activas)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Priorizadas según gravedad e histéresis
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #90ab8b' }}>
              <div className="kpi-card-header">
                <span>REGLAS DE MONITOREO</span>
                <Layers size={18} color="#90ab8b" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.reglas_activas ?? '—'}</span>
                <span className="kpi-subtext">activas</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#9bb0a5' }}>
                Configuración actual del monitoreo
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #6ee7b7' }}>
              <div className="kpi-card-header">
                <span>ACTIVIDAD DEL MONITOREO</span>
                <CheckCircle size={18} color="#6ee7b7" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.825rem', color: '#ebf4dd' }}>
                  Alertas registradas: <strong>{summary?.metricas_validacion?.total_alertas_historicas ?? '—'}</strong>
                </span>
                <span style={{ fontSize: '0.825rem', color: '#ebf4dd' }}>
                  Tiempo medio de evaluación: <strong>{summary?.metricas_validacion?.latencia_media_segundos != null ? `${summary.metricas_validacion.latencia_media_segundos}s` : 'Sin datos'}</strong>
                </span>
                <span style={{ fontSize: '0.825rem', color: '#6ee7b7' }}>
                  Alertas resueltas: <strong>{summary?.metricas_validacion?.alertas_resueltas ?? '—'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1rem', color: '#90ab8b' }}>Agentes de monitoreo</h2>
            <div className="agents-grid">
              {summary?.agentes.map((agente) => (
                <div key={agente.id} className={`agent-mini-card ${agente.activo ? 'active' : ''}`}>
                  <Activity size={18} color="#90ab8b" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#ebf4dd' }}>{agente.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9bb0a5' }}>
                      {agente.activo ? 'Activo' : 'Inactivo'}
                    </div>
                    {isAdmin && <div className="local-ai-controls">
                      <label>Autonomía máxima<select value={agente.nivel_autonomia} onChange={async (e) => {
                        try { await axios.put(`/api/agentes/agentes/${agente.tipo}`, { activo: agente.activo, nivel_autonomia_maximo: Number(e.target.value) }); await fetchData(); }
                        catch { setError('No se pudo configurar el agente.'); }
                      }}>{[0,1,2,3,4].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
                      <button className="btn-secondary" onClick={async () => {
                        try { await axios.put(`/api/agentes/agentes/${agente.tipo}`, { activo: !agente.activo, nivel_autonomia_maximo: agente.nivel_autonomia }); await fetchData(); }
                        catch { setError('No se pudo cambiar el estado del agente.'); }
                      }}>{agente.activo ? 'Desactivar' : 'Activar'}</button>
                    </div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bandeja de Alertas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Alertas y recomendaciones ({alertas.length})
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Actualizadas recientemente
              </span>
            </div>

            {alertas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(26,35,42,0.6)', border: '1px solid rgba(144, 171, 139, 0.2)', borderRadius: '12px' }}>
                <CheckCircle size={40} color="#6ee7b7" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#ebf4dd' }}>No hay alertas activas en este momento</h3>
                <p style={{ color: '#9bb0a5' }}>
                  No se han registrado alertas con los datos disponibles.
                </p>
              </div>
            ) : (
              <div className="alertas-list">
                {alertas.map((alerta) => {

                  return (
                    <div key={alerta.id} className={`alerta-item-card sev-${alerta.severidad}`}>
                      <div className="alerta-header-row">
                        <div className="alerta-title-group">
                          <span className={`sev-badge ${alerta.severidad}`}>{alerta.severidad}</span>
                          <h3 className="alerta-title">{alerta.titulo}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#9bb0a5' }}>
                            ({alerta.agente_tipo})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="meta-chip" style={{ color: alerta.estado === 'RESUELTA' ? '#6ee7b7' : '#fde047' }}>
                            Estado: {alerta.estado}
                          </span>
                          <span className="meta-chip">
                            Confianza: {Math.round(alerta.grado_confianza * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="alerta-meta-chips">
                        <span className="meta-chip">Condición: {formatAlertCondition(alerta.condicion_activadora)}</span>
                        <span className="meta-chip">Valor observado: {alerta.valor_observado}{alerta.evidencia?.unidad ?? '%'}</span>
                        {alerta.valor_referencia != null && (
                          <span className="meta-chip">Referencia: {alerta.valor_referencia}{alerta.evidencia?.unidad ?? '%'}</span>
                        )}
                        <span className="meta-chip">
                          Fuente Explicación:{' '}
                          <strong style={{ color: alerta.origen_explicacion === 'IA_LOCAL_BROWSER' ? '#6ee7b7' : '#90ab8b' }}>
                            {alerta.origen_explicacion || 'DETERMINÍSTICO'}
                          </strong>
                        </span>
                      </div>

                      <div className="alerta-body-grid">
                        <div className="alerta-explanation-box">
                          <strong style={{ color: '#90ab8b' }}>Explicación Sustentada en Hechos:</strong>
                          <p style={{ margin: '0.4rem 0 0 0' }}>
                            {alerta.explicacion}
                          </p>
                        </div>

                        <div className="alerta-recommendation-box">
                          <strong style={{ color: '#6ee7b7' }}>Recomendación Estratégica:</strong>
                          <p style={{ margin: '0.4rem 0 0 0' }}>{alerta.recomendacion}</p>
                        </div>
                      </div>

                      <div className="alerta-actions-row">


                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {alerta.estado !== 'EN_ATENCION' && alerta.estado !== 'RESUELTA' && (
                            <button
                              className="btn-secondary"
                              onClick={() => handleUpdateEstadoAlerta(alerta.id, 'EN_ATENCION')}
                            >
                              Tomar en Atención
                            </button>
                          )}
                          {alerta.estado !== 'RESUELTA' && (
                            <button
                              className="btn-success"
                              onClick={() => handleUpdateEstadoAlerta(alerta.id, 'RESUELTA')}
                            >
                              <Check size={14} />
                              Marcar Resuelta
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'reglas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {editingRule && <RuleEditor key={editingRule.id} rule={editingRule} onClose={() => setEditingRule(null)} onSaved={fetchData} />}
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#ebf4dd' }}>
              Reglas de monitoreo
            </h2>
            <p style={{ color: '#9bb0a5', margin: 0 }}>
              Consulta los umbrales, tiempos de espera y niveles de autonomía configurados.
              {' '}El nivel aplicado es el menor entre el nivel de la regla y el máximo del agente. Cambiar el máximo no modifica el nivel configurado en cada regla.
            </p>
          </div>

          <div className="data-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID Regla</th>
                  <th>Agente</th>
                  <th>Nombre</th>
                  <th>Umbral Prev.</th>
                  <th>Umbral Crít.</th>
                  <th>Histéresis Cierre</th>
                  <th>Cooldown</th>
                  <th>Autonomía aplicada</th>
                  <th>Estado</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {reglas.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.id}</code></td>
                    <td><span className="meta-chip">{r.agente_tipo}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                    <td>{r.umbral_preventivo}%</td>
                    <td>{r.umbral_critico}%</td>
                    <td>{r.umbral_cierre_histeresis !== null ? `${r.umbral_cierre_histeresis}%` : 'N/A'}</td>
                    <td>{r.cooldown_seg}s</td>
                    <td>
                      <span className="ai-chip" style={{ background: 'rgba(90, 120, 99, 0.25)', color: '#ebf4dd' }}>
                        Nivel {Math.min(r.nivel_autonomia, summary?.agentes.find((agent) => agent.tipo === r.agente_tipo)?.nivel_autonomia ?? r.nivel_autonomia)}
                      </span>
                      <div style={{ fontSize: '0.75rem', marginTop: '.35rem' }}>
                        Regla: {r.nivel_autonomia} · Máximo del agente: {summary?.agentes.find((agent) => agent.tipo === r.agente_tipo)?.nivel_autonomia ?? '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: r.activa ? '#6ee7b7' : '#f87171', fontWeight: 600 }}>
                        {r.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {isAdmin && <td><button className="btn-secondary" onClick={() => setEditingRule(r)}>Editar</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: HERRAMIENTAS Y AUDITORÍA */}
      {activeTab === 'herramientas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="local-ai-panel">
            <h2>Acciones del agente</h2>
            {actions.length === 0 && <p>No hay acciones registradas.</p>}
            {groupedActions.map((action) => <div key={action.id} className="agent-action-item">
              <p><strong>{actionLabels[action.tipo_accion] ?? action.tipo_accion.replaceAll('_', ' ')}</strong>
                {' · '}{action.estado.replaceAll('_', ' ').toLowerCase()}
                {action.repeticiones > 1 && <span className="meta-chip">{action.repeticiones} registros</span>}</p>
              {action.resultado && <p>{action.resultado}</p>}
              {action.propuesta && <p><strong>Propuesta para revisar:</strong> {action.propuesta}</p>}
              {isAdmin && action.estado === 'PENDIENTE_APROBACION' && <div className="local-ai-controls">
                {[true, false].map((approved) => <button key={String(approved)} className="btn-secondary"
                  disabled={busyActions[action.id]} onClick={() => submitAction(action, 'autorizar', { aprobado: approved })}>
                  {approved ? 'Aprobar propuesta' : 'Rechazar propuesta'}</button>)}
              </div>}
              {action.motivo_bloqueo && <p>{action.motivo_bloqueo}</p>}
              {isAdmin && action.motivo_bloqueo?.includes('destinatarios') && <button className="btn-secondary" onClick={() => {
                const rule = reglas.find((r) => r.id === action.regla_id);
                if (rule) { setEditingRule(rule); setActiveTab('reglas'); }
              }}>Configurar destinatarios</button>}
              {isAdmin && action.estado === 'APROBADA' && action.puede_despachar && <button className="btn-secondary"
                disabled={!action.puede_despachar || busyActions[action.id]}
                onClick={() => submitAction(action, 'ejecutar')}>
                {busyActions[action.id] ? 'Despachando…' : 'Despachar propuesta aprobada al workflow'}</button>}
              {actionErrors[action.id] && <p role="alert">{actionErrors[action.id]}</p>}
            </div>)}
          </section>
          {/* Tool Calling Runner */}
          <div className="tools-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ebf4dd' }}>
                <Terminal size={20} color="#6ee7b7" />
                Consultas de datos
              </h2>
            </div>
            <p style={{ color: '#9bb0a5', margin: 0 }}>
              Consulta los datos disponibles para cada indicador.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_aforo_actual')} disabled={executingTool}>
                Aforo actual
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_resumen_inscripciones')} disabled={executingTool}>
                Inscripciones
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_equipos_fuera_servicio')} disabled={executingTool}>
                Disponibilidad de equipos
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_resumen_riesgo_abandono')} disabled={executingTool}>
                Riesgo de abandono
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_membresias_por_vencer')} disabled={executingTool}>
                Membresías por vencer
              </button>
            </div>

            {toolOutput && (
              <pre
                style={{
                  background: '#10161a',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  color: '#6ee7b7',
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(144, 171, 139, 0.25)',
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                }}
              >
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            )}
          </div>

          {/* Tabla de Auditoría Inmutable */}
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#ebf4dd' }}>
              Historial de decisiones
            </h2>
            <div className="data-table-wrap">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Agente</th>
                    <th>Qué Observó</th>
                    <th>Qué Decidió</th>
                    <th>Por Qué Decidió</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontSize: '0.75rem', color: '#9bb0a5' }}>
                        {h.created_at ? new Date(h.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td><span className="meta-chip">{h.agente_tipo}</span></td>
                      <td style={{ color: '#ebf4dd' }}>{h.que_observo}</td>
                      <td style={{ fontWeight: 600, color: '#6ee7b7' }}>{h.que_decidio}</td>
                      <td style={{ fontSize: '0.825rem', color: '#9bb0a5' }}>{h.por_que_decidio}</td>
                      <td><span className="ai-chip">Nivel {h.nivel_autonomia}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

