import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { GYM_CONFIG } from '../../infrastructure/landingCatalogData';

export const HeroSection: React.FC = () => {
  return (
    <>
      <section className="hero-section" id="inicio">
        <div className="hero-bg-layer" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=85"
            alt="Instalaciones Apex Fitness Club"
            className="hero-bg-image"
            fetchPriority="high"
          />
          <div className="hero-bg-overlay" />
        </div>

        <div className="landing-container hero-container-content">
          <div className="hero-text-content">
            <span className="hero-minimal-kicker">
              Alto Rendimiento Deportivo
            </span>

            <h1 className="hero-heading">
              Transforma tu cuerpo, <em>supera tus límites</em>.
            </h1>

            <p className="hero-description">
              Entrenamiento de alta precisión con biomecánica de competición y acceso inteligente. Diseñado para quienes buscan resultados reales.
            </p>

            <div className="hero-buttons-row">
              <a href="#disciplinas" className="gym-btn gym-btn-primary">
                <span>Explorar disciplinas</span>
                <ArrowRight size={17} />
              </a>

              <a href="#membresias" className="gym-btn gym-btn-outline">
                <Compass size={17} />
                <span>Ver planes</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-strip">
        <div className="landing-container">
          <div className="stats-strip-grid">
            {GYM_CONFIG.stats.map((stat, idx) => (
              <div key={idx} className="stats-strip-item">
                <div className="stats-strip-value">{stat.value}</div>
                <div className="stats-strip-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
