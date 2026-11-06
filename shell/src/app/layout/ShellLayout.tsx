import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShellSidebar } from './ShellSidebar';
import { ShellHeader } from './ShellHeader';
import { ConnectivityBanner } from '../../features/offline/ConnectivityBanner';
import { ConflictResolverModal } from '../../features/offline/ConflictResolverModal';
import './styles/shell-layout.css';

export const ShellLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="shell-layout-wrapper">
      {/* Backdrop para cerrar el sidebar en dispositivos móviles */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      {/* Sidebar fijo con navegación RBAC */}
      <ShellSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Área principal de contenido */}
      <div className="shell-main-area">
        <ConnectivityBanner />
        <ShellHeader onToggleSidebar={toggleMobileSidebar} />

        <main id="microfrontend-container">
          <Outlet />
        </main>
        <ConflictResolverModal />
      </div>
    </div>
  );
};
