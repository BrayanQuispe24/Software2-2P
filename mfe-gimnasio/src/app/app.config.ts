import { ApplicationConfig, provideZonelessChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  CATALOGO_REPOSITORY,
  INSCRIPCION_REPOSITORY,
  PAGO_REPOSITORY,
  CONTROL_ACCESO_REPOSITORY,
  CLIENTE_REPOSITORY,
} from './core/tokens/injection-tokens';

import { CatalogoGraphQLRepository } from './features/catalogo/infrastructure/adapters/catalogo-graphql.repository';
import { InscripcionGraphQLRepository } from './features/inscripciones/infrastructure/adapters/inscripcion-graphql.repository';
import { ControlAccesoGraphQLRepository } from './features/control-acceso/infrastructure/adapters/control-acceso-graphql.repository';
import { ClienteHttpRepository } from './features/clientes/infrastructure/adapters/cliente-http.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // Inyección de dependencias para Clean Architecture
    { provide: CATALOGO_REPOSITORY, useClass: CatalogoGraphQLRepository },
    { provide: INSCRIPCION_REPOSITORY, useClass: InscripcionGraphQLRepository },
    { provide: PAGO_REPOSITORY, useClass: InscripcionGraphQLRepository },
    { provide: CONTROL_ACCESO_REPOSITORY, useClass: ControlAccesoGraphQLRepository },
    { provide: CLIENTE_REPOSITORY, useClass: ClienteHttpRepository },
  ],
};
