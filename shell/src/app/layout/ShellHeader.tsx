import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';

interface ShellHeaderProps {
  onToggleSidebar: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Panel Principal',
  '/admin/users': 'Gestión de Usuarios',
  '/instructor': 'Panel de Instructor',
  '/instructores': 'Planificación Biomecánica',
  '/clientes': 'Microfrontend Portal Socios',
  '/inventario': 'Inventario & Equipos',
  '/gimnasio': 'Gestión Gimnasio e Inscripciones',
};

export const ShellHeader: React.FC<ShellHeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();

  // Obtener la etiqueta del breadcrumb según el pathname
  const currentKey = Object.keys(ROUTE_LABELS).find((key) =>
    location.pathname === key || location.pathname.startsWith(`${key}/`)
  );
  const currentLabel = currentKey ? ROUTE_LABELS[currentKey] : 'Plataforma';

  return (
    <header className="shell-header">
      <div className="shell-header-left">
        <button
          type="button"
          className="sidebar-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Alternar menú lateral"
        >
          <Menu size={20} />
        </button>

        <nav className="shell-breadcrumb" aria-label="Migas de pan">
          <span>Apex Shell</span>
          <ChevronRight size={14} className="shell-breadcrumb-separator" />
          <span className="shell-breadcrumb-current">{currentLabel}</span>
        </nav>
      </div>

      <div className="shell-header-right">
        <div className="sso-status-pill" title="Sesión validada con el Gateway">
          <span className="sso-status-dot" />
          <span>SSO Activo</span>
        </div>
      </div>
    </header>
  );
};
