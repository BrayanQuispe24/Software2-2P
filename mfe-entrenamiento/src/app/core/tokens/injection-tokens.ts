import { InjectionToken } from '@angular/core';
import { EjercicioRepositoryPort } from '../../features/ejercicios/domain/ports/ejercicio-repository.port';
import { RutinaRepositoryPort } from '../../features/rutinas/domain/ports/rutina-repository.port';
import { PlanRepositoryPort } from '../../features/planes/domain/ports/plan-repository.port';
import { NutricionRepositoryPort } from '../../features/nutricion/domain/ports/nutricion-repository.port';
import { AntropometriaRepositoryPort } from '../../features/antropometria/domain/ports/antropometria-repository.port';

export const EJERCICIO_REPOSITORY = new InjectionToken<EjercicioRepositoryPort>('EJERCICIO_REPOSITORY');
export const RUTINA_REPOSITORY = new InjectionToken<RutinaRepositoryPort>('RUTINA_REPOSITORY');
export const PLAN_REPOSITORY = new InjectionToken<PlanRepositoryPort>('PLAN_REPOSITORY');
export const NUTRICION_REPOSITORY = new InjectionToken<NutricionRepositoryPort>('NUTRICION_REPOSITORY');
export const ANTROPOMETRIA_REPOSITORY = new InjectionToken<AntropometriaRepositoryPort>('ANTROPOMETRIA_REPOSITORY');
