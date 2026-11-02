import React from 'react';
import { QrCode, ShieldCheck, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useLandingStore } from '../store/useLandingStore';

export const MobileAppShowcase: React.FC = () => {
  const { openBookingModal } = useLandingStore();
  const userName = 'Mariana Flores';
  const selectedPlan = 'Plan Pro Black';

  return (
    <section className="landing-section" id="app-movil" style={{ borderTop: '1px solid var(--gym-border)' }}>
      <div className="landing-container">
        <div className="mobile-showcase-grid">
          {/* Smartphone Mockup */}
          <div className="iphone-mockup-frame">
            <div className="iphone-notch">
              <div className="notch-camera"></div>
              <div className="notch-speaker"></div>
              <div className="notch-camera"></div>
            </div>

            <div className="phone-screen">
              <div className="phone-app-bar">
                <div className="phone-brand-title">
                  APEX <span>PASS</span>
                </div>
                <div className="phone-status-pill">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                  <span>Acceso Activo</span>
                </div>
              </div>

              <div className="phone-user-box">
                <div className="phone-user-tag">Carnet Digital de Socio</div>
                <div className="phone-user-name">{userName}</div>
                <div className="phone-user-plan">{selectedPlan} • Membresía Vigente</div>
              </div>

              <div className="phone-qr-box">
                {/* Clean Geometric SVG QR Mockup */}
                <svg width="130" height="130" viewBox="0 0 100 100" fill="#090d14">
                  <path d="M0,0 h30 v30 h-30 z M6,6 h18 v18 h-18 z M10,10 h10 v10 h-10 z" />
                  <path d="M70,0 h30 v30 h-30 z M76,6 h18 v18 h-18 z M80,10 h10 v10 h-10 z" />
                  <path d="M0,70 h30 v30 h-30 z M6,76 h18 v18 h-18 z M10,80 h10 v10 h-10 z" />
                  <rect x="40" y="10" width="8" height="8" />
                  <rect x="52" y="15" width="8" height="8" />
                  <rect x="40" y="30" width="8" height="8" />
                  <rect x="15" y="45" width="8" height="8" />
                  <rect x="35" y="45" width="12" height="8" />
                  <rect x="55" y="40" width="8" height="14" />
                  <rect x="70" y="45" width="12" height="8" />
                  <rect x="88" y="45" width="8" height="8" />
                  <rect x="40" y="65" width="8" height="12" />
                  <rect x="52" y="70" width="14" height="8" />
                  <rect x="75" y="65" width="8" height="8" />
                  <rect x="88" y="75" width="8" height="15" />
                  <rect x="40" y="85" width="16" height="8" />
                  <rect x="65" y="85" width="10" height="8" />
                </svg>
                <div className="phone-qr-desc">
                  Acerca el código al torniquete para ingresar
                </div>
              </div>

              <div className="phone-verified-card">
                <ShieldCheck size={24} />
                <div>
                  <div className="phone-verified-title">TORNIQUETE HABILITADO</div>
                  <div className="phone-verified-sub">Apex Sede Central • Registro en 1.8s</div>
                </div>
              </div>

              <button
                type="button"
                className="gym-btn gym-btn-cobalt"
                style={{ padding: '0.65rem', fontSize: '0.8rem', width: '100%', borderRadius: '8px' }}
                onClick={() => openBookingModal('Pase Digital Móvil', 'Gratis / 1 Día')}
              >
                <Sparkles size={14} />
                <span>Solicitar pase de prueba</span>
              </button>
            </div>
          </div>

          {/* Side Info & Benefits */}
          <div>
            <div className="section-kicker">Acceso Ágil</div>
            <h2 className="section-title">Tu Credencial de Acceso Directo en el Celular</h2>

            <p className="section-subtitle">
              Sin tarjetas físicas ni demoras en recepción. El carnet dinámico valida tu membresía de manera instantánea en torniquetes y puntos de control.
            </p>

            <ul className="showcase-features-list">
              <li className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <QrCode size={20} />
                </div>
                <div className="showcase-feature-text">
                  <h4>Control de Entrada y Salida por QR</h4>
                  <p>Código dinámico y seguro que valida el acceso en menos de 2 segundos en torniquetes.</p>
                </div>
              </li>

              <li className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="showcase-feature-text">
                  <h4>Estado de Membresía en Tiempo Real</h4>
                  <p>Consulta tus fechas de vigencia, renovaciones y asistencias del mes con total claridad.</p>
                </div>
              </li>

              <li className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <Zap size={20} />
                </div>
                <div className="showcase-feature-text">
                  <h4>Reserva de Clases Grupales</h4>
                  <p>Asegura tu cupo en spinning, boxeo o yoga sin trámites manuales ni llamadas telefónicas.</p>
                </div>
              </li>
            </ul>

            <div>
              <button
                type="button"
                className="gym-btn gym-btn-cobalt"
                onClick={() => openBookingModal('Pase Digital Móvil', 'Gratis / 1 Día')}
              >
                <span>Generar pase de cortesía</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
