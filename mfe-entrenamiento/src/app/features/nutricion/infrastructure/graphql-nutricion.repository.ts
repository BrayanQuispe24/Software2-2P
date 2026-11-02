import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { NutricionRepositoryPort } from '../domain/ports/nutricion-repository.port';
import { PlanAlimentacion, AsignarPlanAlimentacionInput } from '../domain/models/nutricion.model';

@Injectable({
  providedIn: 'root',
})
export class GraphQLNutricionRepository implements NutricionRepositoryPort {
  constructor(private readonly graphql: GraphQLClientService) {}

  async obtenerPlanActivo(usuarioId: string): Promise<PlanAlimentacion | null> {
    const query = `
      query PlanAlimentacionActivo($usuarioId: ID!) {
        planAlimentacionActivo(usuarioId: $usuarioId) {
          id
          idUsuario
          nombre
          objetivo
          fechaInicio
          fechaFin
          observacion
          estado
          comidas {
            id
            diaSemana
            tipoComida
            alimento
            cantidad
            unidad
            hora
            calorias
            proteinas
            carbohidratos
            grasas
            observacion
          }
        }
      }
    `;
    const res = await this.graphql.query<{ planAlimentacionActivo: PlanAlimentacion | null }>(query, { usuarioId });
    return res.planAlimentacionActivo;
  }

  async asignarPlan(input: AsignarPlanAlimentacionInput): Promise<PlanAlimentacion> {
    const query = `
      mutation AsignarPlanAlimentacion($input: AsignarPlanAlimentacionInput!) {
        asignarPlanAlimentacion(input: $input) {
          id
          nombre
          objetivo
          estado
        }
      }
    `;
    const res = await this.graphql.query<{ asignarPlanAlimentacion: PlanAlimentacion }>(query, { input });
    return res.asignarPlanAlimentacion;
  }
}
