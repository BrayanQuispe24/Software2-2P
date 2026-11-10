import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, UserCheck, QrCode, FileText, Dumbbell, Wrench, Activity, BrainCircuit, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSessionQuery } from '../hooks/useSessionQuery';
import axios from 'axios';

interface ChurnSummaryData {
  estado: string;
  modelo_version: string;
  algoritmo: string;
  total_evaluados: number;
  tasa_riesgo_alto_pct: number;
  tasa_riesgo_medio_pct: number;
  tasa_riesgo_bajo_pct: number;
  distribucion: { BAJO: number; MEDIO: number; ALTO: number };
  predicciones_muestra?: Array<{
    cliente_id: string;
    probabilidad: number;
    nivel_riesgo: string;
    factores: string[];
    recomendaciones: string[];
  }>;
}

export function DashboardPage() {
  const { data: session } = useSessionQuery();
  const [churnData, setChurnData] = useState<ChurnSummaryData | null>(null);
  const [loadingChurn, setLoadingChurn] = useState<boolean>(false);

  const fetchChurn = async () => {
    setLoadingChurn(true);
    try {
      const res = await axios.get('/api/churn/summary');
      setChurnData(res.data);
    } catch (e) {
      console.error('Error al consultar métricas de Churn ML:', e);
    } finally {
      setLoadingChurn(false);
    }
  };

  useEffect(() => {
    fetchChurn();
  }, []);

  const user = session?.user;
  const roles = user?.roles || [];
  const canAccessInstructor = roles.includes('ADMINISTRADOR') || roles.includes('INSTRUCTOR');
  const canAccessUsers = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA');
  const canAccessGimnasio = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA') || roles.includes('INSTRUCTOR');
  const canAccessInventario = roles.includes('ADMINISTRADOR') || roles.includes('RECEPCIONISTA') || roles.includes('INSTRUCTOR');
  const canAccessSocio = roles.includes('CLIENTE') || roles.includes('ADMINISTRADOR') || roles.length === 0;

  return (
    <div className="dashboard-view">
      <div className="welcome-banner" style={{ marginTop: 0 }}>
        <h2>Panel de Control Principal</h2>
        <p>
          Sesión centralizada mediante autenticación corporativa. Tus permisos y módulos se validan en el Gateway BFF.
        </p>
      </div>

      <div className="dashboard-grid">
          <div className="card full-width" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BrainCircuit size={22} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0 }}>Predicción de Abandono y Retención (Random Forest ML)</h3>
                <span className="badge badge-mini" style={{ background: churnData?.estado === 'ACTIVO' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: churnData?.estado === 'ACTIVO' ? '#38bdf8' : '#f87171' }}>
                  {churnData?.estado === 'ACTIVO' ? `MODELO ACTIVO (v${churnData?.modelo_version})` : 'MODELO OFFLINE'}
                </span>
              </div>
              <button
                onClick={fetchChurn}
                disabled={loadingChurn}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                <RefreshCw size={13} className={loadingChurn ? 'animate-spin' : ''} />
                <span>Recalcular Inferencia</span>
              </button>
            </div>

            {churnData && churnData.estado === 'ACTIVO' ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <AlertTriangle size={16} color="#f87171" />
                      <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>Alto Riesgo de Abandono</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>
                      {churnData.tasa_riesgo_alto_pct}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {churnData.distribucion.ALTO} socio(s) en umbral crítico
                    </span>
                  </div>

                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '0.9rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fde047', fontWeight: 600 }}>Riesgo Moderado</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#facc15' }}>
                      {churnData.tasa_riesgo_medio_pct}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {churnData.distribucion.MEDIO} socio(s) en seguimiento
                    </span>
                  </div>

                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '8px', padding: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <ShieldCheck size={16} color="#4ade80" />
                      <span style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600 }}>Bajo Riesgo / Fidelizados</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80' }}>
                      {churnData.tasa_riesgo_bajo_pct}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {churnData.distribucion.BAJO} socio(s) estables
                    </span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Muestreo de Inferencia en Tiempo Real (Top Evaluados por Motor ML):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {churnData.predicciones_muestra?.map((p) => (
                      <span
                        key={p.cliente_id}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          background: p.nivel_riesgo === 'ALTO' ? 'rgba(239, 68, 68, 0.2)' : p.nivel_riesgo === 'MEDIO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: p.nivel_riesgo === 'ALTO' ? '#fca5a5' : p.nivel_riesgo === 'MEDIO' ? '#fde047' : '#86efac',
                          border: `1px solid ${p.nivel_riesgo === 'ALTO' ? 'rgba(239, 68, 68, 0.3)' : p.nivel_riesgo === 'MEDIO' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        }}
                      >
                        <strong>{p.cliente_id}</strong>: {p.probabilidad}% prob. ({p.nivel_riesgo})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.5rem 0' }}>
                {loadingChurn ? 'Consultando inferencia del motor Random Forest...' : 'Motor de Machine Learning en proceso de inicio o en espera.'}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Identidad del Usuario</h3>
            <div className="info-row">
              <span className="info-label">Subject (Sub):</span>
              <span className="info-value"><code>{user?.sub}</code></span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email || 'No proporcionado'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{user?.name || 'Usuario'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Código:</span>
              <span className="info-value"><code>{user?.codigo || 'N/A'}</code></span>
            </div>
          </div>

          <div className="card">
            <h3>Roles Asignados (RBAC)</h3>
            <div className="badges-wrap">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span key={role} className="badge badge-role">
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-muted">Sin roles asignados</span>
              )}
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Módulos Autorizados</h3>
            <div className="modules-list">
              {canAccessInstructor && (
                <Link to="/instructor" className="module-link">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} style={{ color: 'var(--accent)' }} />
                    <span>Módulo de Instructores</span>
                  </span>
                  <span className="badge badge-mini">ADMINISTRADOR | INSTRUCTOR</span>
                </Link>
              )}

              {canAccessUsers && (
                <>
                  <Link to="/admin/users" className="module-link">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} style={{ color: 'var(--accent)' }} />
                      <span>{roles.includes('INSTRUCTOR') && !roles.includes('ADMINISTRADOR') && !roles.includes('RECEPCIONISTA') ? 'Directorio de Clientes' : 'Gestión de Usuarios (Backoffice)'}</span>
                    </span>
                    <span className="badge badge-mini">
                      {roles.includes('INSTRUCTOR') && !roles.includes('ADMINISTRADOR') && !roles.includes('RECEPCIONISTA') ? 'INSTRUCTOR' : 'ADMINISTRADOR | RECEPCIONISTA'}
                    </span>
                  </Link>

                  <Link to="/admin/monitoreo-inteligente" className="module-link" style={{ borderLeft: '3px solid #818cf8' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} style={{ color: '#818cf8' }} />
                      <span>Centro de monitoreo</span>
                    </span>
                    <span className="badge badge-mini" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                      IA AUTÓNOMA
                    </span>
                  </Link>
                </>
              )}

              {canAccessGimnasio && (
                <Link to="/gimnasio" className="module-link">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={18} style={{ color: '#90ab8b' }} />
                    <span>Gestión Gimnasio (MFE)</span>
                  </span>
                  <span className="badge badge-mini">OPERATIVO</span>
                </Link>
              )}

              {canAccessInventario && (
                <Link to="/inventario" className="module-link">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={18} style={{ color: '#90ab8b' }} />
                    <span>Inventario & Equipos (MFE)</span>
                  </span>
                  <span className="badge badge-mini">OPERATIVO</span>
                </Link>
              )}

              {canAccessSocio && (
                <>
                  <Link to="/portal-socio" className="module-link" style={{ borderLeft: '3px solid #6ee7b7' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={18} style={{ color: '#6ee7b7' }} />
                      <span>Portal del Socio (Vista Integral)</span>
                    </span>
                    <span className="badge badge-mini" style={{ background: 'rgba(110, 231, 183, 0.15)', color: '#6ee7b7' }}>
                      CLIENTE
                    </span>
                  </Link>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Link to="/portal-socio" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.4rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(144,171,139,0.15)', color: '#ebf4dd', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <QrCode size={16} color="#6ee7b7" />
                      <span>1. Pase QR</span>
                    </Link>
                    <Link to="/portal-socio" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.4rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(144,171,139,0.15)', color: '#ebf4dd', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <FileText size={16} color="#6ee7b7" />
                      <span>2. Boleta</span>
                    </Link>
                    <Link to="/portal-socio" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.4rem', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(144,171,139,0.15)', color: '#ebf4dd', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <Dumbbell size={16} color="#6ee7b7" />
                      <span>3. Plan Asignado</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card full-width">
            <h3>Permisos Granulares Concedidos ({user?.permissions?.length || 0})</h3>
            <div className="badges-wrap">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm) => (
                  <span key={perm} className="badge badge-perm">
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-muted">Sin permisos directos</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
