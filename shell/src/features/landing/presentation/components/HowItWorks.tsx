import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../../infrastructure/landingCatalogData';

export const HowItWorks: React.FC = () => {
  return (
    <section className="landing-section" id="como-funciona" style={{ borderTop: '1px solid var(--gym-border)' }}>
      <div className="landing-container">
        <div className="section-header text-left">
          <div className="section-kicker">Tu Recorrido</div>
          <h2 className="section-title">De la Inscripción al Primer Entrenamiento</h2>
          <p className="section-subtitle">
            Un proceso sin filas, sin burocracia y con soporte presencial desde el primer día.
          </p>
        </div>

        <div className="steps-timeline-grid">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.stepNumber} className="step-card">
              <div className="step-header-index">{step.stepNumber}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
              <a href={step.actionHref} className="step-action-link">
                <span>{step.actionLabel}</span>
                <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
