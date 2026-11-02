import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { PlanRepositoryPort } from '../domain/ports/plan-repository.port';
import { PlanEntrenamiento, AsignarPlanEntrenamientoInput } from '../domain/models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class GraphQLPlanRepository implements PlanRepositoryPort {
  constructor(private readonly graphql: GraphQLClientService) {}

  async obtenerPlanActivo(usuarioId: string): Promise<PlanEntrenamiento | null> {
    const query = `
      query PlanActivo($usuarioId: ID!) {
        planEntrenamientoActivo(usuarioId: $usuarioId) {
          id
          idUsuario
          nombre
          objetivo
          fechaInicio
          fechaFin
          estado
          observacion
          rutinasProgramadas {
            id
            diaSemana
            rutina {
              id
              nombre
              nivel
              rutinaEjercicios {
                id
                series
                repeticiones
                peso
                duracionSegundos
                descansoSegundos
                orden
                ejercicio {
                  id
                  nombre
                  nivelDificultad
                }
              }
            }
          }
        }
      }
    `;
    const res = await this.graphql.query<{ planEntrenamientoActivo: PlanEntrenamiento | null }>(query, { usuarioId });
    return res.planEntrenamientoActivo;
  }

  async asignarPlan(input: AsignarPlanEntrenamientoInput): Promise<PlanEntrenamiento> {
    const query = `
      mutation AsignarPlan($input: AsignarPlanEntrenamientoInput!) {
        asignarPlanEntrenamiento(input: $input) {
          id
          nombre
          objetivo
          estado
        }
      }
    `;
    const res = await this.graphql.query<{ asignarPlanEntrenamiento: PlanEntrenamiento }>(query, { input });
    return res.asignarPlanEntrenamiento;
  }
}
