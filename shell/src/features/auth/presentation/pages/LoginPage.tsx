import { Navigate, Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck, QrCode, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSessionQuery, useAuthActions } from '../hooks/useSessionQuery';

export function LoginPage() {
  const { data: session, isLoading } = useSessionQuery();
  const { login } = useAuthActions();

  if (isLoading) {
    return (
      <div className="center-screen">
        <div className="loading-card">
          <div className="spinner"></div>
          <p className="loading-text">Comprobando autenticación previa...</p>
        </div>
      </div>
    );
  }

  if (session?.authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cream)',
              boxShadow: '0 8px 25px rgba(90, 120, 99, 0.35)',
            }}
          >
            <Dumbbell size={28} />
          </div>
        </div>

        <div className="auth-badge">Apex Fitness Club &bull; Portal de Acceso</div>
        <h1 className="auth-title">Acceso al Sistema</h1>
        <p className="auth-subtitle">
          Inicia sesión para gestionar tus entrenamientos, registrar accesos en torniquetes o administrar el gimnasio.
        </p>

        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon" style={{ display: 'flex', color: 'var(--accent)' }}>
              <QrCode size={22} />
            </span>
            <div>
              <strong>Control por QR</strong>
              <p>Acceso rápido en torniquetes</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" style={{ display: 'flex', color: 'var(--success)' }}>
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>Sesión Segura</strong>
              <p>Autenticación centralizada SSO</p>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={login}>
          <span>Iniciar sesión con Cuenta Institucional</span>
          <ArrowRight size={18} className="btn-arrow" />
        </button>

        <div style={{ marginTop: '1.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={15} />
            <span>Volver a la página principal</span>
          </Link>
        </div>

        <footer className="auth-footer" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Perfiles habilitados: <code>ADMINISTRADOR</code>, <code>RECEPCIONISTA</code>, <code>INSTRUCTOR</code>, <code>CLIENTE</code>
        </footer>
      </div>
    </div>
  );
}
