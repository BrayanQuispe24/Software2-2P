import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  Compass,
  LogOut,
  Layers,
  Wrench,
  UserCheck,
} from 'lucide-react';
import { useSessionQuery, SESSION_QUERY_KEY } from '../../features/auth/presentation/hooks/useSessionQuery';
import { useQueryClient } from '@tanstack/react-query';
import { ssoAuthService } from '../../shared/auth/ssoAuthService';
import type { Role } from '../../features/auth/domain/Role';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: Role[];
  badge?: string;
  badgeType?: 'mfe' | 'native';
}

const SYSTEM_MODULES: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Portal del Socio',
    path: '/portal-socio',
    icon: UserCheck,
    roles: ['CLIENTE', 'ADMINISTRADOR'],
    badge: 'Socio',
    badgeType: 'native',
  },
  {
    name: 'Gestión de Usuarios',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR'],
    badge: 'Core',
    badgeType: 'native',
  },
];

const MICROFRONTENDS_MODULES: NavItem[] = [
  {
    name: 'Planificación Biomecánica',
    path: '/instructores',
    icon: Dumbbell,
    roles: ['ADMINISTRADOR', 'INSTRUCTOR'],
    badge: 'MFE',
    badgeType: 'mfe',
  },
  {
    name: 'Inventario & Equipos',
    path: '/inventario',
    icon: Wrench,
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR'],
    badge: 'MFE',
    badgeType: 'mfe',
  },
  {
    name: 'Gestión Gimnasio',
    path: '/gimnasio',
    icon: Dumbbell,
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR'],
    badge: 'MFE',
    badgeType: 'mfe',
  },
];

interface ShellSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ShellSidebar: React.FC<ShellSidebarProps> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const { data: session } = useSessionQuery();
  const user = session?.user ?? ssoAuthService.getCurrentUser();

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    queryClient.clear();
    await ssoAuthService.logout();
  };

  const userRoles = user?.roles ?? [];

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      // Si el item no especifica roles, es público para todos los usuarios autenticados
      if (!item.roles || item.roles.length === 0) return true;
      // Si el usuario no tiene roles cargados aún, mostramos por defecto para no ocultar en desarrollo
      if (userRoles.length === 0) return true;
      return item.roles.some((role) => userRoles.includes(role));
    });
  };

  const visibleSystemModules = filterByRole(SYSTEM_MODULES);
  const visibleMfeModules = filterByRole(MICROFRONTENDS_MODULES);

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'A';

  const userRole = userRoles[0] || 'ADMINISTRADOR';

  return (
    <aside className={`shell-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top">
        {/* Brand */}
        <Link to="/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
          <div className="sidebar-brand-icon">
            <Dumbbell size={20} />
          </div>
          <div className="sidebar-brand-info">
            <span className="sidebar-brand-name">
              APEX <span>FITNESS</span>
            </span>
            <span className="sidebar-brand-badge">
              <Layers size={11} />
              Shell • single-spa
            </span>
          </div>
        </Link>

        {/* Sección: Módulos del Sistema (Dashboard y Gestión de Usuarios) */}
        <div className="sidebar-nav-section">
          <span className="sidebar-section-title">Administración & Sistema</span>
          <ul className="sidebar-nav-list">
            {visibleSystemModules.map((item) => {
              const Icon = item.icon;
              const isInstructorOnly = userRoles.includes('INSTRUCTOR') && !userRoles.includes('ADMINISTRADOR') && !userRoles.includes('RECEPCIONISTA');
              const itemLabel = item.path === '/admin/users' && isInstructorOnly ? 'Directorio de Clientes' : item.name;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onCloseMobile}
                  >
                    <div className="sidebar-link-content">
                      <Icon size={18} className="sidebar-link-icon" />
                      <span>{itemLabel}</span>
                    </div>
                    {item.badge && (
                      <span className={`mfe-pill-badge ${item.badgeType === 'native' ? 'native-badge' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sección: Microfrontends orquestados con single-spa (solo si hay módulos para el rol) */}
        {visibleMfeModules.length > 0 && (
          <div className="sidebar-nav-section" style={{ marginTop: '1.25rem' }}>
            <span className="sidebar-section-title">Microfrontends (single-spa)</span>
            <ul className="sidebar-nav-list">
              {visibleMfeModules.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                      }
                      onClick={onCloseMobile}
                    >
                      <div className="sidebar-link-content">
                        <Icon size={18} className="sidebar-link-icon" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && <span className="mfe-pill-badge">{item.badge}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {user?.name || user?.email || 'Usuario Apex'}
            </span>
            <span className="sidebar-user-role-badge">{userRole}</span>
          </div>
        </div>

        <div className="sidebar-footer-actions">
          <Link
            to="/"
            className="sidebar-action-btn"
            title="Ver Landing Page pública"
            onClick={onCloseMobile}
          >
            <Compass size={16} />
            <span>Ver Landing Page</span>
          </Link>

          <button
            type="button"
            className="sidebar-action-btn logout"
            onClick={handleLogout}
            title="Cerrar sesión en SSO Gateway"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
