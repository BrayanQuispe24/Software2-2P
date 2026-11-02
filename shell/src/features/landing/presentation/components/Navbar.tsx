import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, LogIn, Menu, X } from 'lucide-react';
import { useLandingStore } from '../store/useLandingStore';
import { useSessionQuery } from '../../../auth/presentation/hooks/useSessionQuery';

export const Navbar: React.FC = () => {
  const { mobileNavOpen, toggleMobileNav } = useLandingStore();
  const { data: session } = useSessionQuery();

  return (
    <header className="gym-navbar">
      <div className="landing-container">
        <div className="navbar-inner">
          <a href="#inicio" className="navbar-brand">
            <div className="brand-icon">
              <Dumbbell size={22} />
            </div>
            <div className="brand-name">
              APEX <span>FITNESS</span>
            </div>
          </a>

          <nav className="desktop-nav" aria-label="Navegación principal">
            <ul className="nav-links">
              <li>
                <a href="#disciplinas" className="nav-link">
                  Disciplinas
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="nav-link">
                  Cómo Funciona
                </a>
              </li>
              <li>
                <a href="#app-movil" className="nav-link">
                  App & QR
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="nav-link">
                  Ecosistema
                </a>
              </li>
              <li>
                <a href="#membresias" className="nav-link">
                  Planes
                </a>
              </li>
              <li>
                <a href="#contacto" className="nav-link">
                  Contacto
                </a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            {session?.authenticated ? (
              <Link to="/dashboard" className="nav-login-btn" style={{ background: 'var(--palette-forest, #5A7863)' }} title="Ir al Panel de Control">
                <LogIn size={15} />
                <span>Ir al Panel ({session.user.name?.split(' ')[0] || 'Mi Cuenta'})</span>
              </Link>
            ) : (
              <Link to="/login" className="nav-login-btn" title="Portal de Socios y Staff">
                <LogIn size={15} />
                <span>Acceso al Sistema</span>
              </Link>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => toggleMobileNav()}
              aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="mobile-nav-drawer">
            <nav className="mobile-nav-links">
              <a
                href="#disciplinas"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                Disciplinas
              </a>
              <a
                href="#como-funciona"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                Cómo Funciona
              </a>
              <a
                href="#app-movil"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                App & QR
              </a>
              <a
                href="#ecosistema"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                Ecosistema
              </a>
              <a
                href="#membresias"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                Planes
              </a>
              <a
                href="#contacto"
                className="mobile-nav-link"
                onClick={() => toggleMobileNav(false)}
              >
                Contacto
              </a>
            </nav>

            <div className="mobile-nav-actions">
              <Link
                to="/login"
                className="mobile-login-link"
                onClick={() => toggleMobileNav(false)}
              >
                <LogIn size={16} />
                <span>Acceso al Sistema</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
