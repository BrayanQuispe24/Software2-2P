import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ssoAuthService } from '../../shared/auth/ssoAuthService';
import { useSessionQuery } from '../../features/auth/presentation/hooks/useSessionQuery';
import { REGISTERED_MFES } from './singleSpaConfig';

interface MicrofrontendHostProps {
  appName: string;
}

export const MicrofrontendHost: React.FC<MicrofrontendHostProps> = ({ appName }) => {
  const navigate = useNavigate();
  const mfeConfig = REGISTERED_MFES.find((mfe) => mfe.name === appName);
  const { data: session } = useSessionQuery();
  const currentUser = session?.user || ssoAuthService.getCurrentUser();
  const activeRole = currentUser?.roles?.[0] || 'ADMINISTRADOR';

  const baseUrl = mfeConfig?.entryUrl
    ? mfeConfig.entryUrl.replace(/\/main\.js$/, '/').replace(/\/plataforma-[^/]+\.js$/, '/')
    : null;

  const iframeSrc = baseUrl
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}role=${encodeURIComponent(activeRole)}`
    : null;

  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>(
    baseUrl ? 'checking' : 'offline'
  );

  const userRoles = currentUser?.roles || [];
  const hasAccess = mfeConfig
    ? mfeConfig.roles.some((role) => userRoles.includes(role))
    : false;

  useEffect(() => {
    if (!currentUser) {
      ssoAuthService.loadSession().then((user) => {
        if (!user) {
          navigate('/login', { replace: true });
        } else if (mfeConfig && !mfeConfig.roles.some((r) => user.roles?.includes(r))) {
          navigate('/403', { replace: true });
        }
      });
    } else if (mfeConfig && !hasAccess) {
      navigate('/403', { replace: true });
    }
  }, [appName, mfeConfig, currentUser, hasAccess, navigate]);

  useEffect(() => {
    if (!baseUrl) {
      setStatus('offline');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    fetch(baseUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
      .then(() => {
        clearTimeout(timeout);
        if (isMounted) setStatus('online');
      })
      .catch(() => {
        clearTimeout(timeout);
        if (isMounted) setStatus('offline');
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [baseUrl]);

  return (
    <div
      id={`single-spa-application:${appName}`}
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {status === 'online' && baseUrl && (
        <iframe
          src={iframeSrc || baseUrl}
          title={appName}
          onError={() => setStatus('offline')}
          onLoad={(e) => {
            try {
              e.currentTarget.contentWindow?.postMessage(
                {
                  type: 'SSO_USER_INFO',
                  user: currentUser,
                  role: activeRole,
                },
                '*'
              );
            } catch {
              // Safe cross-domain communication
            }
          }}
          allow="camera; microphone; display-capture"
          style={{
            width: '100%',
            height: 'calc(100vh - 120px)',
            minHeight: '820px',
            border: 'none',
            borderRadius: '8px',
            background: '#162026',
            flex: 1,
            display: 'block',
          }}
        />
      )}

      {status === 'offline' && (
        <div
          style={{
            padding: '2.5rem',
            margin: '1.5rem 0',
            width: '100%',
            borderRadius: '8px',
            background: 'rgba(34, 45, 53, 0.7)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ebf4dd',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#f87171',
                boxShadow: '0 0 10px #f87171',
              }}
            />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#fca5a5',
              }}
            >
              Módulo Fuera de Línea • Aislamiento de Fallos Activo
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.6rem',
              margin: '0 0 0.5rem 0',
              color: '#ebf4dd',
            }}
          >
            {appName} no disponible
          </h2>
          <p
            style={{
              color: '#9bb0a5',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              maxWidth: '750px',
            }}
          >
            El servidor remoto de este microfrontend no responde en{' '}
            <code>{mfeConfig?.entryUrl || 'desconocido'}</code>. Gracias a la arquitectura desacoplada de
            single-spa, el resto de la plataforma continúa funcionando sin interrupciones.
          </p>

          <div
            style={{
              background: 'rgba(22, 32, 38, 0.6)',
              padding: '1rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              border: '1px solid rgba(144, 171, 139, 0.15)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div>
              <strong>Ruta solicitada:</strong> <code>{mfeConfig?.route}</code>
            </div>
            <div>
              <strong>Estado del Shell:</strong>{' '}
              <span style={{ color: '#6ee7b7', fontWeight: 600 }}>Operativo y seguro (Fallo contenido)</span>
            </div>
            <div>
              <strong>Causa:</strong>{' '}
              <span style={{ color: '#fca5a5' }}>Servidor de desarrollo detenido o bundle inalcanzable.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setStatus('online');
                window.location.reload();
              }}
              style={{
                padding: '0.55rem 1.1rem',
                background: 'linear-gradient(135deg, #5a7863 0%, #4d6955 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar Conexión
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.55rem 1.1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(144, 171, 139, 0.25)',
                color: '#ebf4dd',
                borderRadius: '5px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
