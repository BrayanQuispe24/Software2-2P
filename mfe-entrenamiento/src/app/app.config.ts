import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  EJERCICIO_REPOSITORY,
  RUTINA_REPOSITORY,
  PLAN_REPOSITORY,
  NUTRICION_REPOSITORY,
  ANTROPOMETRIA_REPOSITORY,
} from './core/tokens/injection-tokens';
import { GraphQLEjercicioRepository } from './features/ejercicios/infrastructure/graphql-ejercicio.repository';
import { GraphQLRutinaRepository } from './features/rutinas/infrastructure/graphql-rutina.repository';
import { GraphQLPlanRepository } from './features/planes/infrastructure/graphql-plan.repository';
import { GraphQLNutricionRepository } from './features/nutricion/infrastructure/graphql-nutricion.repository';
import { GraphQLAntropometriaRepository } from './features/antropometria/infrastructure/graphql-antropometria.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: EJERCICIO_REPOSITORY, useClass: GraphQLEjercicioRepository },
    { provide: RUTINA_REPOSITORY, useClass: GraphQLRutinaRepository },
    { provide: PLAN_REPOSITORY, useClass: GraphQLPlanRepository },
    { provide: NUTRICION_REPOSITORY, useClass: GraphQLNutricionRepository },
    { provide: ANTROPOMETRIA_REPOSITORY, useClass: GraphQLAntropometriaRepository },
  ],
};
