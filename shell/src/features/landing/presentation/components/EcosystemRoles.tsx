import React from 'react';
import { CheckCircle2, User, Award, Shield, LayoutDashboard } from 'lucide-react';
import { ECOSYSTEM_ROLES } from '../../infrastructure/landingCatalogData';
import { useLandingStore } from '../store/useLandingStore';

export const EcosystemRoles: React.FC = () => {
  const { activeRoleTab, setActiveRoleTab } = useLandingStore();

  const currentRole = ECOSYSTEM_ROLES.find((role) => role.id === activeRoleTab) || ECOSYSTEM_ROLES[0];

  const getRoleIcon = (id: string) => {
    switch (id) {
      case 'socio':
        return <User size={16} />;
      case 'instructor':
        return <Award size={16} />;
      case 'recepcion':
        return <Shield size={16} />;
      case 'admin':
        return <LayoutDashboard size={16} />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <section className="landing-section" id="ecosistema" style={{ borderTop: '1px solid var(--gym-border)' }}>
      <div className="landing-container">
        <div className="section-header text-center">
          <div className="section-kicker">Roles y Staff</div>
          <h2 className="section-title">Una Experiencia Diseñada para Cada Perfil</h2>
          <p className="section-subtitle">
            Conectamos a atletas, entrenadores, recepción y gerencia en un entorno ágil y coordinado.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="roles-tabs-nav">
          {ECOSYSTEM_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`role-tab-btn ${activeRoleTab === role.id ? 'active' : ''}`}
              onClick={() => setActiveRoleTab(role.id)}
            >
              {getRoleIcon(role.id)}
              <span>{role.tabLabel}</span>
            </button>
          ))}
        </div>

        {/* Active Role Content */}
        <div className="role-panel-content">
          <div>
            <span className="role-badge-tag">{currentRole.badge}</span>
            <h3 className="role-title">{currentRole.title}</h3>
            <p className="role-desc">{currentRole.description}</p>

            <ul className="role-features-list">
              {currentRole.features.map((item, idx) => (
                <li key={idx} className="role-feature-item">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{item.title}</strong> {item.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="role-visual-preview">
            <div className="preview-tag">{currentRole.visualCard.tag}</div>
            <div className="preview-headline">{currentRole.visualCard.headline}</div>

            {currentRole.visualCard.statNumber && (
              <div className="preview-stat-box">
                <div className="preview-stat-number">{currentRole.visualCard.statNumber}</div>
                <div className="preview-stat-label">{currentRole.visualCard.statLabel}</div>
              </div>
            )}

            <div className="preview-highlight-box">
              <div className="preview-highlight-title">{currentRole.visualCard.highlightTitle}</div>
              <div className="preview-highlight-sub">{currentRole.visualCard.highlightSubtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
