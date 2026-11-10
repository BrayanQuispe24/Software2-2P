import { registerApplication, start, type LifeCycles } from 'single-spa';
import { ssoAuthService } from '../../shared/auth/ssoAuthService';
import type { Role } from '../../features/auth/domain/Role';

export interface MicrofrontendAppConfig {
  name: string;
  route: string;
  roles: Role[];
  entryUrl?: string;
  description?: string;
}

/**
 * Catálogo de microfrontends registrados en el Shell.
 * Cuando los bundles remotos estén publicados en sus respectivos puertos,
 * single-spa los descargará y montará dinámicamente.
 */
const env = (import.meta as unknown as { env?: Record<string, string> })?.env || {};
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const mfeEntrenamientoUrl = env['VITE_MFE_ENTRENAMIENTO_URL'] || (isLocalhost ? 'http://localhost:9102' : '/mfe/entrenamiento');
const mfeClientesUrl = env['VITE_MFE_CLIENTES_URL'] || (isLocalhost ? 'http://localhost:9103' : '/mfe/clientes');
const mfeInventarioUrl = env['VITE_MFE_INVENTARIO_URL'] || (isLocalhost ? 'http://localhost:9104' : '/mfe/inventario');
const mfeGimnasioUrl = env['VITE_MFE_GIMNASIO_URL'] || (isLocalhost ? 'http://localhost:9105' : '/mfe/gimnasio');

export const REGISTERED_MFES: MicrofrontendAppConfig[] = [
  {
    name: '@plataforma/instructores',
    route: '/instructores',
    roles: ['ADMINISTRADOR', 'INSTRUCTOR'],
    entryUrl: `${mfeEntrenamientoUrl}/main.js`,
    description: 'Módulo de gestión de clases, asistencias y rutinas de instructores',
  },
  {
    name: '@plataforma/clientes',
    route: '/clientes',
    roles: ['ADMINISTRADOR', 'CLIENTE'],
    entryUrl: `${mfeClientesUrl}/plataforma-clientes.js`,
    description: 'Portal de socios: membresías, reservas y código QR',
  },
  {
    name: '@plataforma/inventario',
    route: '/inventario',
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR'],
    entryUrl: `${mfeInventarioUrl}/main.js`,
    description: 'Módulo de inventario, equipamiento, mantenimiento preventivo/correctivo y Kardex',
  },
  {
    name: '@plataforma/gimnasio',
    route: '/gimnasio',
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUCTOR'],
    entryUrl: `${mfeGimnasioUrl}/main.js`,
    description: 'Módulo de gestión del gimnasio: inscripciones, pagos, planes, tarifas, disciplinas y torniquete',
  },
];

/**
 * Valida si la ruta actual coincide con la ruta asignada al microfrontend.
 */
export function matchesMfeRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * Determina si el usuario actual cuenta con roles permitidos para el microfrontend.
 */
export function canAccessMfe(app: MicrofrontendAppConfig): boolean {
  const user = ssoAuthService.getCurrentUser();
  if (!user) return false;
  return ssoAuthService.hasAnyRole(app.roles);
}


/**
 * Ciclo de vida single-spa para microfrontends remotos.
 * En esta arquitectura, MicrofrontendHost.tsx en React es la única fuente
 * de verdad responsable de renderizar el iframe y gestionar fallbacks en el DOM.
 * single-spa supervisa el registro, activación por ruta y propagación de props globales.
 */
function createRemoteMfe(app: MicrofrontendAppConfig): LifeCycles {
  return {
    bootstrap: async () => {
      console.log(`[single-spa] Bootstrapping microfrontend: ${app.name}`);
    },
    mount: async () => {
      console.log(`[single-spa] Montado microfrontend activo: ${app.name} (${app.route})`);
    },
    unmount: async () => {
      console.log(`[single-spa] Desmontando microfrontend: ${app.name}`);
    },
  };
}

let isInitialized = false;

/**
 * Inicializa el motor de single-spa y registra los microfrontends configurados.
 */
export function initSingleSpa(): void {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  console.log('[single-spa] Inicializando orquestador de microfrontends...');

  for (const app of REGISTERED_MFES) {
    registerApplication({
      name: app.name,
      app: async () => {
        return createRemoteMfe(app);
      },
      activeWhen: (location) => {
        return matchesMfeRoute(location.pathname, app.route);
      },
      customProps: {
        getAuthUser: () => ssoAuthService.getCurrentUser(),
        logout: () => ssoAuthService.logout(),
      },
    });
  }

  // Iniciar el ciclo de vida de single-spa
  start({
    urlRerouteOnly: true,
  });

  console.log('[single-spa] Orquestador iniciado exitosamente.');
}
