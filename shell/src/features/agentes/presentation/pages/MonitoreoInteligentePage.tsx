import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  Cpu,
  ShieldAlert,
  Sliders,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  Users,
  TrendingDown,
  RefreshCw,
  Terminal,
  Clock,
  Check,
} from 'lucide-react';
import { browserAiEngine, type ModelLoadingState, type AlertaData } from '../../infrastructure/browserAiEngine';
import '../styles/monitoreo-inteligente.css';

interface DashboardSummary {
  monitoreo_activo: boolean;
  aforo_actual_pct: number;
  aforo_presentes: number;
  aforo_capacidad: number;
  alertas_abiertas: number;
  alertas_criticas: number;
  reglas_activas: number;
  agentes: { id: string; tipo: string; nombre: string; activo: boolean; nivel_autonomia: number }[];
  metricas_validacion: {
    precision_alertas_pct: number;
    tasa_falsas_alarmas_pct: number;
    latencia_media_segundos: number;
    acciones_sensibles_no_autorizadas: number;
    duplicados_indebidos: number;
    total_alertas_historicas: number;
    alertas_resueltas: number;
  };
}

export const MonitoreoInteligentePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitoreo' | 'simulador' | 'reglas' | 'herramientas'>('monitoreo');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alertas, setAlertas] = useState<AlertaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingAlertId, setAnalyzingAlertId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<Record<string, string>>({});

  // Estado del Motor de IA en Navegador
  const [aiState, setAiState] = useState<ModelLoadingState>(browserAiEngine.getState());
  const [selectedModel, setSelectedModel] = useState<string>('SmolLM2-360M-Instruct-q4f16_1-MLC');

  const AVAILABLE_MODELS = [
    { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', name: 'SmolLM2 360M (Ultra Rápido • ~200MB)' },
    { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B (Recomendado • ~700MB)' },
    { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 0.5B (Ligero • ~350MB)' },
    { id: 'Gemma-2-2B-It-q4f16_1-MLC', name: 'Gemma 2 2B (Alta Precisión • ~1.4GB)' },
  ];

  // Simulador de Aforo
  const [capacidadMax, setCapacidadMax] = useState(100);
  const [personasPresentes, setPersonasPresentes] = useState(92);
  const [umbralPrev, setUmbralPrev] = useState(90);
  const [umbralCrit, setUmbralCrit] = useState(100);
  const [umbralHist, setUmbralHist] = useState(85);
  const [simResultado, setSimResultado] = useState<any>(null);

  // Reglas
  const [reglas, setReglas] = useState<any[]>([]);

  // Consola de Herramientas
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [executingTool, setExecutingTool] = useState(false);

  // Historial
  const [historial, setHistorial] = useState<any[]>([]);

  // Suscripción al motor de IA Local en el Navegador
  useEffect(() => {
    const unsubscribe = browserAiEngine.subscribe((state) => {
      setAiState(state);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, alertRes, regRes, histRes] = await Promise.all([
        axios.get('/api/agentes/dashboard/summary'),
        axios.get('/api/agentes/alertas'),
        axios.get('/api/agentes/reglas'),
        axios.get('/api/agentes/historial?limit=20'),
      ]);
      setSummary(sumRes.data);
      setAlertas(alertRes.data);
      setReglas(regRes.data);
      setHistorial(histRes.data);
    } catch (e) {
      console.warn('Error al cargar datos de ms-agentes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 25000);
    return () => clearInterval(interval);
  }, []);

  // Simulación interactiva de regla de aforo en vivo
  useEffect(() => {
    const runSim = async () => {
      try {
        const res = await axios.post('/api/agentes/simulador/aforo', {
          capacidad_maxima: capacidadMax,
          personas_presentes: personasPresentes,
          umbral_preventivo: umbralPrev,
          umbral_critico: umbralCrit,
          umbral_histeresis: umbralHist,
        });
        setSimResultado(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    runSim();
  }, [capacidadMax, personasPresentes, umbralPrev, umbralCrit, umbralHist]);

  const handleRunScenario = async (escenario: string) => {
    setLoading(true);
    try {
      await axios.post('/api/agentes/evaluaciones/ejecutar', {
        tipo_ejecucion: 'SIMULACION',
        escenario,
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithBrowserAi = async (alerta: AlertaData) => {
    if (!aiState.isLoaded) {
      await browserAiEngine.loadModel();
    }

    setAnalyzingAlertId(alerta.id);
    setStreamingText((prev) => ({ ...prev, [alerta.id]: '' }));

    try {
      const result = await browserAiEngine.generateExplanation(alerta, (chunk) => {
        setStreamingText((prev) => ({
          ...prev,
          [alerta.id]: (prev[alerta.id] || '') + chunk,
        }));
      });

      // Sincronizar hacia el backend
      await browserAiEngine.syncExplanationWithBackend(
        alerta.id,
        result.explicacion,
        result.recomendacion,
        result.tokensSegundo
      );

      await fetchData();
    } catch (err) {
      console.error('Error al analizar con IA Local:', err);
    } finally {
      setAnalyzingAlertId(null);
    }
  };

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
      const res = await browserAiEngine.executeTool(toolName, params);
      setToolOutput(res);
    } catch (err: any) {
      setToolOutput({ error: err.message });
    } finally {
      setExecutingTool(false);
    }
  };

  return (
    <div className="monitoreo-container">
      {/* Cabecera Principal */}
      <div className="monitoreo-header">
        <div className="monitoreo-title">
          <h1>
            <Activity color="#818cf8" size={28} />
            Centro de Monitoreo Inteligente (CU-23)
          </h1>
          <p>
            Supervisor autónomo digital de ApexFitness. Ejecuta el ciclo continuo{' '}
            <strong>Observar $\rightarrow$ Analizar $\rightarrow$ Decidir $\rightarrow$ Actuar $\rightarrow$ Evaluar</strong>{' '}
            con deduplicación, histéresis y control de autonomía (Niveles 0 al 4).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="status-badge-active">
            <span className="status-dot-pulse" />
            Monitoreo Activo (30s)
          </div>
          <button className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Banner de IA Local en el Navegador (WebGPU / WASM) */}
      <div className="browser-ai-banner">
        <div className="browser-ai-top">
          <div className="browser-ai-info">
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.25)',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={24} color="#c084fc" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>Motor de IA Local en el Navegador</span>
                <span className="ai-chip">{aiState.engine}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{aiState.statusText}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {aiState.tokensSec && (
              <span style={{ fontSize: '0.825rem', color: '#34d399', fontWeight: 600 }}>
                ⚡ {aiState.tokensSec} tokens/seg
              </span>
            )}

            {!aiState.isLoaded ? (
              <>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={aiState.isLoading}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-primary"
                  onClick={() => browserAiEngine.loadModel(selectedModel)}
                  disabled={aiState.isLoading}
                >
                  <Sparkles size={16} />
                  {aiState.isLoading ? 'Descargando Modelo...' : 'Cargar IA en Navegador'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.875rem', fontWeight: 600 }}>
                <CheckCircle size={18} />
                <span>Modelo Listo: <strong>{aiState.modelName}</strong></span>
              </div>
            )}
          </div>
        </div>

        {aiState.isLoading && (
          <div className="browser-ai-progress-bar">
            <div className="browser-ai-progress-fill" style={{ width: `${aiState.progress}%` }} />
          </div>
        )}
      </div>

      {/* Navegación por Pestañas */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'monitoreo' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoreo')}
        >
          <Activity size={18} />
          Alertas & Monitoreo en Vivo
        </button>
        <button
          className={`tab-btn ${activeTab === 'simulador' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulador')}
        >
          <Sliders size={18} />
          Simulador de Regla de Aforo (Sección 7)
        </button>
        <button
          className={`tab-btn ${activeTab === 'reglas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reglas')}
        >
          <Layers size={18} />
          Reglas & Autonomía (0 a 4)
        </button>
        <button
          className={`tab-btn ${activeTab === 'herramientas' ? 'active' : ''}`}
          onClick={() => setActiveTab('herramientas')}
        >
          <Terminal size={18} />
          Herramientas de Agente & Auditoría
        </button>
      </div>

      {/* PESTAÑA 1: MONITOREO Y ALERTAS */}
      {activeTab === 'monitoreo' && (
        <>
          {/* Tarjetas KPI */}
          <div className="kpi-cards-grid">
            <div className="kpi-card" style={{ borderLeft: '4px solid #eab308' }}>
              <div className="kpi-card-header">
                <span>OCUPACIÓN ACTUAL</span>
                <span className="sev-badge PREVENTIVA">PREVENTIVA</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.aforo_actual_pct || 92}%</span>
                <span className="kpi-subtext">
                  ({summary?.aforo_presentes || 92} / {summary?.aforo_capacidad || 100} plazas)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Umbral preventivo configurado: 90%
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="kpi-card-header">
                <span>ALERTAS ABIERTAS</span>
                <ShieldAlert size={18} color="#ef4444" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.alertas_abiertas ?? 3}</span>
                <span className="kpi-subtext" style={{ color: '#fca5a5' }}>
                  ({summary?.alertas_criticas ?? 1} crítica activa)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Priorizadas según gravedad e histéresis
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #818cf8' }}>
              <div className="kpi-card-header">
                <span>REGLAS DETERMINÍSTICAS</span>
                <Layers size={18} color="#818cf8" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-number">{summary?.reglas_activas ?? 5}</span>
                <span className="kpi-subtext">activas</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                5 categorías especializadas
              </span>
            </div>

            <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="kpi-card-header">
                <span>MÉTRICAS VALIDACIÓN (SEC. 13)</span>
                <CheckCircle size={18} color="#10b981" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.825rem', color: '#e2e8f0' }}>
                  • Precisión: <strong>{summary?.metricas_validacion?.precision_alertas_pct || 98.2}%</strong> (Obj. &ge; 95%)
                </span>
                <span style={{ fontSize: '0.825rem', color: '#e2e8f0' }}>
                  • Latencia: <strong>{summary?.metricas_validacion?.latencia_media_segundos || 0.45}s</strong> (Obj. &le; 10s)
                </span>
                <span style={{ fontSize: '0.825rem', color: '#34d399' }}>
                  • Acciones no autorizadas: <strong>0</strong> | Duplicados: <strong>0</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Los 5 Agentes Especializados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Los 5 Agentes Especializados de Supervisión (CU-23)
            </span>
            <div className="agents-grid">
              <div className="agent-mini-card active">
                <Users size={18} color="#818cf8" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>1. Aforo & Concurrencia</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ms-gimnasio • Ocupación & Horarios</div>
                </div>
              </div>
              <div className="agent-mini-card active">
                <TrendingDown size={18} color="#f97316" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>2. Actividad Comercial</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ms-gimnasio • Matrículas & Altas</div>
                </div>
              </div>
              <div className="agent-mini-card active">
                <Sparkles size={18} color="#c084fc" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>3. Retención de Clientes</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ms-machine-learning • Riesgo Churn</div>
                </div>
              </div>
              <div className="agent-mini-card active">
                <Wrench size={18} color="#06b6d4" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>4. Disponibilidad Operativa</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ms-inventario • Equipos Críticos</div>
                </div>
              </div>
              <div className="agent-mini-card active">
                <Clock size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>5. Seguimiento de Alertas</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cierre, Histéresis & SLA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Escenarios de Prueba */}
          <div className="scenarios-bar">
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Play size={16} color="#818cf8" />
                Inyección de Escenarios de Validación:
              </span>
              <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                Ejecuta los casos reales del documento para comprobar deduplicación, histéresis y escalamiento.
              </span>
            </div>
            <div className="scenarios-btn-group">
              <button className="scenario-btn" onClick={() => handleRunScenario('AFORO_92')}>
                1. Aforo 92% (Preventivo)
              </button>
              <button className="scenario-btn" onClick={() => handleRunScenario('AFORO_100')}>
                2. Aforo 100% (Crítico - Escalar)
              </button>
              <button className="scenario-btn" onClick={() => handleRunScenario('AFORO_82')}>
                3. Aforo 82% (Cierre Histéresis)
              </button>
              <button className="scenario-btn" onClick={() => handleRunScenario('COMERCIAL_CHURN')}>
                4. Matrículas -25% + ML Churn
              </button>
              <button className="scenario-btn" onClick={() => handleRunScenario('OPERATIVO_EQUIPOS')}>
                5. Equipos (3/5 fuera servicio)
              </button>
            </div>
          </div>

          {/* Bandeja de Alertas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Alertas Activas & Recomendaciones Inteligentes ({alertas.length})
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Ordenadas por severidad y tiempo de atención
              </span>
            </div>

            {alertas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(30,41,59,0.4)', borderRadius: '10px' }}>
                <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                <h3>No hay alertas activas en este momento</h3>
                <p style={{ color: '#94a3b8' }}>
                  Todos los indicadores del gimnasio se encuentran dentro de los parámetros normales.
                </p>
              </div>
            ) : (
              <div className="alertas-list">
                {alertas.map((alerta) => {
                  const isCurrentAnalyzing = analyzingAlertId === alerta.id;
                  const streamed = streamingText[alerta.id];

                  return (
                    <div key={alerta.id} className={`alerta-item-card sev-${alerta.severidad}`}>
                      <div className="alerta-header-row">
                        <div className="alerta-title-group">
                          <span className={`sev-badge ${alerta.severidad}`}>{alerta.severidad}</span>
                          <h3 className="alerta-title">{alerta.titulo}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            ({alerta.agente_tipo})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="meta-chip" style={{ color: alerta.estado === 'RESUELTA' ? '#34d399' : '#fde047' }}>
                            Estado: {alerta.estado}
                          </span>
                          <span className="meta-chip">
                            Confianza: {Math.round((alerta.grado_confianza || 1) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="alerta-meta-chips">
                        <span className="meta-chip">Condición: {alerta.condicion_activadora}</span>
                        <span className="meta-chip">Valor observado: {alerta.valor_observado}%</span>
                        {alerta.valor_referencia !== undefined && (
                          <span className="meta-chip">Referencia: {alerta.valor_referencia}%</span>
                        )}
                        <span className="meta-chip">
                          Fuente Explicación:{' '}
                          <strong style={{ color: alerta.origen_explicacion === 'IA_LOCAL_BROWSER' ? '#c084fc' : '#818cf8' }}>
                            {alerta.origen_explicacion || 'DETERMINÍSTICO'}
                          </strong>
                        </span>
                      </div>

                      <div className="alerta-body-grid">
                        <div className="alerta-explanation-box">
                          <strong>Explicación Sustentada en Hechos:</strong>
                          <p style={{ margin: '0.4rem 0 0 0' }}>
                            {isCurrentAnalyzing && streamed ? streamed : alerta.explicacion}
                          </p>
                        </div>

                        <div className="alerta-recommendation-box">
                          <strong style={{ color: '#a5b4fc' }}>Recomendación Estratégica:</strong>
                          <p style={{ margin: '0.4rem 0 0 0' }}>{alerta.recomendacion}</p>
                        </div>
                      </div>

                      <div className="alerta-actions-row">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleAnalyzeWithBrowserAi(alerta)}
                            disabled={isCurrentAnalyzing}
                          >
                            <Sparkles size={14} />
                            {isCurrentAnalyzing ? 'Generando en Navegador...' : 'Interpretar con IA Local'}
                          </button>
                        </div>

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

      {/* PESTAÑA 2: SIMULADOR DE REGLA DE AFORO */}
      {activeTab === 'simulador' && (
        <div className="simulator-panel">
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              Simulador Interactivo de Regla de Aforo (Sección 7)
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Permite al administrador ajustar parámetros de capacidad, umbrales e histéresis sin modificar el código fuente.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="slider-group">
              <div className="slider-label-row">
                <span>Capacidad Máxima (Plazas):</span>
                <strong>{capacidadMax}</strong>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={capacidadMax}
                onChange={(e) => setCapacidadMax(Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span>Personas Presentes (Aforo actual):</span>
                <strong>{personasPresentes}</strong>
              </div>
              <input
                type="range"
                min="0"
                max={capacidadMax}
                value={personasPresentes}
                onChange={(e) => setPersonasPresentes(Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span>Umbral Preventivo (%):</span>
                <strong>{umbralPrev}%</strong>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={umbralPrev}
                onChange={(e) => setUmbralPrev(Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span>Umbral Crítico (%):</span>
                <strong>{umbralCrit}%</strong>
              </div>
              <input
                type="range"
                min="95"
                max="100"
                value={umbralCrit}
                onChange={(e) => setUmbralCrit(Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span>Umbral de Histéresis para Cierre (%):</span>
                <strong>{umbralHist}%</strong>
              </div>
              <input
                type="range"
                min="60"
                max="90"
                value={umbralHist}
                onChange={(e) => setUmbralHist(Number(e.target.value))}
                className="custom-range"
              />
            </div>
          </div>

          {/* Tarjeta de Decisión del Agente */}
          {simResultado && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Evaluación del Agente en Tiempo Real</span>
                <span className={`sev-badge ${simResultado.severidad}`}>{simResultado.estado}</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>Ocupación de Sala:</span>
                  <strong>{simResultado.porcentaje_ocupacion}% ({simResultado.personas_presentes} de {simResultado.capacidad_maxima} plazas)</strong>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, simResultado.porcentaje_ocupacion)}%`,
                      background:
                        simResultado.porcentaje_ocupacion >= umbralCrit
                          ? '#ef4444'
                          : simResultado.porcentaje_ocupacion >= umbralPrev
                          ? '#eab308'
                          : '#10b981',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #818cf8' }}>
                <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.25rem' }}>Acción Propuesta por el Agente:</div>
                <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{simResultado.recomendacion}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCapacidadMax(100);
                    setPersonasPresentes(92);
                    setUmbralPrev(90);
                    setUmbralCrit(100);
                    setUmbralHist(85);
                  }}
                >
                  <RotateCcw size={14} />
                  Restablecer Ejemplo del Documento (92%)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: REGLAS Y NIVELES DE AUTONOMÍA */}
      {activeTab === 'reglas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              Configuración de Reglas Determinísticas y Niveles de Autonomía (Secciones 7 y 8)
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Reglas editables en caliente sin reiniciar servicios. Niveles: 0 (Observación), 1 (Alerta), 2 (Recomendación), 3 (Automatización n8n), 4 (Acción Sensible con confirmación).
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
                  <th>Nivel Autonomía</th>
                  <th>Estado</th>
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
                      <span className="ai-chip" style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
                        Nivel {r.nivel_autonomia}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: r.activa ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {r.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
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
          {/* Tool Calling Runner */}
          <div className="simulator-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={20} color="#818cf8" />
                Herramientas Autorizadas del Agente (Tool-Calling)
              </h2>
            </div>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Invoca de forma directa las herramientas que utiliza el agente para consultar los microservicios sin acceso directo a SQL.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_aforo_actual')} disabled={executingTool}>
                obtener_aforo_actual()
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_resumen_inscripciones')} disabled={executingTool}>
                obtener_resumen_inscripciones()
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_equipos_fuera_servicio')} disabled={executingTool}>
                obtener_equipos_fuera_servicio()
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_resumen_riesgo_abandono')} disabled={executingTool}>
                obtener_resumen_riesgo_abandono()
              </button>
              <button className="btn-secondary" onClick={() => handleExecuteTool('obtener_membresias_por_vencer')} disabled={executingTool}>
                obtener_membresias_por_vencer()
              </button>
            </div>

            {toolOutput && (
              <pre
                style={{
                  background: '#090d16',
                  padding: '1rem',
                  borderRadius: '8px',
                  color: '#34d399',
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            )}
          </div>

          {/* Tabla de Auditoría Inmutable */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
              Bitácora de Decisiones & Auditoría Inmutable (CU-23)
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
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {h.created_at ? new Date(h.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td><span className="meta-chip">{h.agente_tipo}</span></td>
                      <td style={{ color: '#e2e8f0' }}>{h.que_observo}</td>
                      <td style={{ fontWeight: 600, color: '#818cf8' }}>{h.que_decidio}</td>
                      <td style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>{h.por_que_decidio}</td>
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
  );
};

