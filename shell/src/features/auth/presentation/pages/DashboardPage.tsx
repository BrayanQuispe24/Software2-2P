import { Link } from 'react-router-dom';
import { Award, Users, UserCheck, QrCode, FileText, Dumbbell, Wrench } from 'lucide-react';
import { useSessionQuery } from '../hooks/useSessionQuery';

export function DashboardPage() {
  const { data: session } = useSessionQuery();

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
                <Link to="/admin/users" className="module-link">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} style={{ color: 'var(--accent)' }} />
                    <span>{roles.includes('INSTRUCTOR') && !roles.includes('ADMINISTRADOR') && !roles.includes('RECEPCIONISTA') ? 'Directorio de Clientes' : 'Gestión de Usuarios (Backoffice)'}</span>
                  </span>
                  <span className="badge badge-mini">
                    {roles.includes('INSTRUCTOR') && !roles.includes('ADMINISTRADOR') && !roles.includes('RECEPCIONISTA') ? 'INSTRUCTOR' : 'ADMINISTRADOR | RECEPCIONISTA'}
                  </span>
                </Link>
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
