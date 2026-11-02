import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useSessionQuery } from '../hooks/useSessionQuery';

export function ForbiddenPage() {
  const { data: session } = useSessionQuery();

  return (
    <div className="center-screen">
      <div className="forbidden-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(212, 255, 50, 0.12)',
              border: '1px solid rgba(212, 255, 50, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <ShieldAlert size={36} />
          </div>
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>403 - Acceso Restringido</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Tu cuenta (<code>{session?.user.email || session?.user.sub}</code>) no cuenta con los roles requeridos para visualizar este módulo.
        </p>
        <p className="text-muted" style={{ marginBottom: '1.75rem' }}>
          Roles asignados: <strong>{session?.user.roles.join(', ') || 'Ninguno'}</strong>
        </p>

        <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
          <ArrowLeft size={16} />
          <span>Regresar al Panel Principal</span>
        </Link>
      </div>
    </div>
  );
}
