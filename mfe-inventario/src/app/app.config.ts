import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { EQUIPO_REPOSITORY, MANTENIMIENTO_REPOSITORY, MOVIMIENTO_REPOSITORY } from './core/tokens/injection-tokens';
import { EquipoGraphQLRepository } from './features/equipos/infrastructure/equipo-graphql.repository';
import { MantenimientoGraphQLRepository } from './features/mantenimientos/infrastructure/mantenimiento-graphql.repository';
import { MovimientoGraphQLRepository } from './features/inventario/infrastructure/movimiento-graphql.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: EQUIPO_REPOSITORY, useClass: EquipoGraphQLRepository },
    { provide: MANTENIMIENTO_REPOSITORY, useClass: MantenimientoGraphQLRepository },
    { provide: MOVIMIENTO_REPOSITORY, useClass: MovimientoGraphQLRepository },
  ],
};
