import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionQuery } from '../hooks/useSessionQuery';
import type { Role } from '../../domain/Role';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, isLoading, error } = useSessionQuery();

  if (isLoading) {
    return (
      <div className="center-screen">
        <div className="loading-card">
          <div className="spinner"></div>
          <p className="loading-text">Verificando sesión segura con API Gateway (BFF)...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.authenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = session.user.roles || [];
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
