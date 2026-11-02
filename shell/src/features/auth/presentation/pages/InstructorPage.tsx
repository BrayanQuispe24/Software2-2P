import { useSessionQuery } from '../hooks/useSessionQuery';

export function InstructorPage() {
  const { data: session } = useSessionQuery();

  return (
    <div className="instructor-view">
      <div className="welcome-banner" style={{ borderColor: 'var(--palette-forest)', marginTop: 0 }}>
        <h2>Gestión de Clases e Instrucción</h2>
        <p>
          Vista protegida por <code>ProtectedRoute(allowedRoles=['ADMINISTRADOR', 'INSTRUCTOR'])</code>.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <h3>Bienvenido instructor {session?.user.name}</h3>
          <p>
            Esta sección demuestra cómo Clean Architecture y el control RBAC de roles permiten desacoplar completamente la autorización del frontend respecto a la validación de tokens del Gateway.
          </p>
        </div>
      </div>
    </div>
  );
}
