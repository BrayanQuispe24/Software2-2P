import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './features/auth/presentation/components/ProtectedRoute';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { DashboardPage } from './features/auth/presentation/pages/DashboardPage';
import { InstructorPage } from './features/auth/presentation/pages/InstructorPage';
import { ForbiddenPage } from './features/auth/presentation/pages/ForbiddenPage';
import { UsersManagementPage } from './features/users/presentation/pages/UsersManagementPage';
import { MonitoreoInteligentePage } from './features/agentes/presentation/pages/MonitoreoInteligentePage';
import { PortalSocioPage } from './features/portal-socio/presentation/pages/PortalSocioPage';
import { LandingPage } from './features/landing';
import { MicrofrontendHost } from './app/microfrontends/MicrofrontendHost';
import { ShellLayout } from './app/layout/ShellLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Vistas Públicas (Sin Sidebar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Ecosistema Autenticado del Shell (Con Sidebar y Header) */}
          <Route
            element={
              <ProtectedRoute>
                <ShellLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/instructor"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'INSTRUCTOR']}>
                  <InstructorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR']}>
                  <UsersManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/monitoreo-inteligente"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'RECEPCIONISTA']}>
                  <MonitoreoInteligentePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/portal-socio"
              element={
                <ProtectedRoute allowedRoles={['CLIENTE', 'ADMINISTRADOR']}>
                  <PortalSocioPage />
                </ProtectedRoute>
              }
            />

            {/* Rutas Delegadas a Microfrontends single-spa */}
            <Route
              path="/instructores/*"
              element={<MicrofrontendHost appName="@plataforma/instructores" />}
            />
            <Route
              path="/clientes/*"
              element={<MicrofrontendHost appName="@plataforma/clientes" />}
            />
            <Route
              path="/inventario/*"
              element={<MicrofrontendHost appName="@plataforma/inventario" />}
            />
            <Route
              path="/gimnasio/*"
              element={<MicrofrontendHost appName="@plataforma/gimnasio" />}
            />
          </Route>

          {/* Control de Acceso y Redirección */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
