import React from 'react';
import { Dumbbell, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { GYM_CONFIG } from '../../infrastructure/landingCatalogData';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="gym-footer" id="contacto">
      <div className="landing-container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div>
            <div className="navbar-brand">
              <div className="brand-icon">
                <Dumbbell size={22} />
              </div>
              <div className="brand-name">
                APEX <span>FITNESS</span>
              </div>
            </div>

            <p className="footer-brand-desc">{GYM_CONFIG.description}</p>

            <div className="footer-social-links">
              <a
                href={`https://wa.me/${GYM_CONFIG.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="social-icon-btn"
                title="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a href="#contacto" className="social-icon-btn" title="Teléfono">
                <Phone size={18} />
              </a>
              <a href="#contacto" className="social-icon-btn" title="Correo">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-col-title">Navegación</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#inicio" className="footer-nav-link">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#disciplinas" className="footer-nav-link">
                  Disciplinas & Zonas
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="footer-nav-link">
                  Cómo Inscribirse
                </a>
              </li>
              <li>
                <a href="#app-movil" className="footer-nav-link">
                  App Móvil & Pase QR
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="footer-nav-link">
                  Ecosistema & Staff
                </a>
              </li>
              <li>
                <a href="#membresias" className="footer-nav-link">
                  Tarifas de Membresías
                </a>
              </li>
            </ul>
          </div>

          {/* Weekly Schedule */}
          <div>
            <h4 className="footer-col-title">Horarios de Atención</h4>
            <ul className="footer-schedule-list">
              {GYM_CONFIG.schedule.map((item, idx) => (
                <li key={idx} className="footer-schedule-item">
                  <span>{item.days}</span>
                  <span>{item.hours}</span>
                </li>
              ))}
            </ul>
            <div
              style={{
                marginTop: '1rem',
                fontSize: '0.78rem',
                color: 'var(--gym-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Clock size={14} />
              <span>Acceso continuo sin reserva previa de hora</span>
            </div>
          </div>

          {/* Location & Contact */}
          <div>
            <h4 className="footer-col-title">Ubicación & Contacto</h4>
            <div className="footer-contact-items">
              <div className="footer-contact-item">
                <MapPin size={18} />
                <span>
                  {GYM_CONFIG.contact.address}, {GYM_CONFIG.contact.city}
                </span>
              </div>
              <div className="footer-contact-item">
                <Phone size={18} />
                <span>{GYM_CONFIG.contact.phone}</span>
              </div>
              <div className="footer-contact-item">
                <MessageCircle size={18} />
                <span>WhatsApp: {GYM_CONFIG.contact.whatsapp}</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={18} />
                <span>{GYM_CONFIG.contact.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>
            © {CURRENT_YEAR} {GYM_CONFIG.name}. Todos los derechos reservados.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Términos de Servicio</span>
            <span>Política de Privacidad</span>
            <span>Reglamento Interno</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
