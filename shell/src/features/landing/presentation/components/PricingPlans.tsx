import React from 'react';
import { Check, Star } from 'lucide-react';
import { GYM_PLANS } from '../../infrastructure/landingCatalogData';
import { useLandingStore } from '../store/useLandingStore';

export const PricingPlans: React.FC = () => {
  const { openBookingModal } = useLandingStore();

  return (
    <section className="landing-section" id="membresias" style={{ borderTop: '1px solid var(--gym-border)' }}>
      <div className="landing-container">
        <div className="section-header text-center">
          <div className="section-kicker">Planes y Tarifas</div>
          <h2 className="section-title">Tarifas Transparentes, Sin Matrícula Oculta</h2>
          <p className="section-subtitle">
            Elige la modalidad que se adapte a tu nivel y disponibilidad. Todos los planes mensuales incluyen lockers y duchas.
          </p>
        </div>

        <div className="pricing-grid">
          {GYM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}
            >
              {plan.highlightText && (
                <div className="popular-badge">
                  <Star size={12} fill="#ffffff" />
                  <span>{plan.highlightText}</span>
                </div>
              )}

              <div className="plan-header-tag">{plan.tag}</div>
              <h3 className="plan-name">{plan.name}</h3>

              <div className="plan-price-wrap">
                <span className="plan-price-amount">{plan.price}</span>
                <span className="plan-price-period">{plan.period}</span>
              </div>

              <p className="plan-desc">{plan.description}</p>

              <ul className="plan-features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="plan-feature-item">
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`gym-btn ${plan.isPopular ? 'gym-btn-cobalt' : 'gym-btn-outline'}`}
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => openBookingModal(plan.name, `${plan.price} ${plan.period}`)}
              >
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
