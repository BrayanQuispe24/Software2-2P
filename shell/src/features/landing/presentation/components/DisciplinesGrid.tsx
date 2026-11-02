import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { GYM_DISCIPLINES } from '../../infrastructure/landingCatalogData';
import { useLandingStore } from '../store/useLandingStore';

export const DisciplinesGrid: React.FC = () => {
  const { openBookingModal } = useLandingStore();

  return (
    <section className="landing-section" id="disciplinas">
      <div className="landing-container">
        <div className="section-header text-center">
          <div className="section-kicker">Zonas y Especialidades</div>
          <h2 className="section-title">Instalaciones de Competición y Entrenamiento</h2>
          <p className="section-subtitle">
            6 espacios integrados con biomecánica de vanguardia y entrenadores dedicados en sala.
          </p>
        </div>

        <div className="disciplines-grid">
          {GYM_DISCIPLINES.map((discipline) => (
            <div key={discipline.id} className="discipline-card">
              <div className="discipline-img-wrapper">
                <img src={discipline.imageUrl} alt={discipline.title} className="discipline-img" />
                {discipline.highlightBadge && (
                  <span className="discipline-tag-badge">{discipline.highlightBadge}</span>
                )}
              </div>

              <div className="discipline-content">
                <div className="discipline-category">{discipline.category}</div>
                <h3 className="discipline-title">{discipline.title}</h3>
                <p className="discipline-desc">{discipline.description}</p>

                <ul className="discipline-benefits">
                  {discipline.benefits.map((benefit, idx) => (
                    <li key={idx} className="discipline-benefit-item">
                      <Check size={14} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="gym-btn gym-btn-outline"
                  style={{ marginTop: 'auto', width: '100%', padding: '0.75rem' }}
                  onClick={() => openBookingModal(`Clase de ${discipline.title}`, 'Gratis / 1 Sesión')}
                >
                  <span>Probar esta zona</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
