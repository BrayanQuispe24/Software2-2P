import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLandingStore } from '../store/useLandingStore';
import { GYM_CONFIG } from '../../infrastructure/landingCatalogData';

export const CtaBanner: React.FC = () => {
  const { openBookingModal } = useLandingStore();

  return (
    <section className="landing-section" style={{ padding: '3.5rem 0 5.5rem' }}>
      <div className="landing-container">
        <div className="cta-banner-wrapper">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">
              ¿Listo para empezar a entrenar en {GYM_CONFIG.name}?
            </h2>
            <p className="cta-banner-desc">
              Pide tu pase de cortesía gratuito sin compromiso y prueba nuestras instalaciones guiado por un coach certificado.
            </p>
          </div>

          <div className="cta-banner-actions">
            <button
              type="button"
              className="gym-btn gym-btn-cobalt"
              style={{ padding: '1rem 2rem', fontSize: '1rem' }}
              onClick={() => openBookingModal('Pase de Cortesía 1 Día', 'Gratis / 1 Día')}
            >
              <span>Solicitar clase gratis</span>
            </button>

            <a
              href="#membresias"
              className="gym-btn gym-btn-outline"
              style={{ padding: '1rem 1.85rem', fontSize: '1rem' }}
            >
              <span>Ver todas las membresías</span>
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
