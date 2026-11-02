import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { EjercicioRepositoryPort } from '../domain/ports/ejercicio-repository.port';
import { Ejercicio, TipoEjercicio, GrupoMuscular, CrearEjercicioInput } from '../domain/models/ejercicio.model';

@Injectable({
  providedIn: 'root',
})
export class GraphQLEjercicioRepository implements EjercicioRepositoryPort {
  constructor(private readonly graphql: GraphQLClientService) {}

  async listarEjercicios(tipoEjercicioId?: string, nivelDificultad?: string): Promise<Ejercicio[]> {
    const query = `
      query ListarEjercicios($tipoEjercicioId: ID, $nivelDificultad: String) {
        ejercicios(tipoEjercicioId: $tipoEjercicioId, nivelDificultad: $nivelDificultad) {
          id
          externalId
          nombre
          descripcion
          urlVideo
          imagenes
          fuerza
          equipamiento
          nivelDificultad
          mecanica
          patronMovimiento
          tipoEjercicio {
            id
            nombre
          }
          gruposMusculares {
            id
            tipoParticipacion
            observacion
            grupoMuscular {
              id
              nombre
            }
          }
        }
      }
    `;
    const res = await this.graphql.query<{ ejercicios: Ejercicio[] }>(query, {
      tipoEjercicioId,
      nivelDificultad,
    });
    return res.ejercicios;
  }

  async listarTipos(): Promise<TipoEjercicio[]> {
    const query = `
      query {
        tiposEjercicio {
          id
          nombre
          descripcion
          estado
        }
      }
    `;
    const res = await this.graphql.query<{ tiposEjercicio: TipoEjercicio[] }>(query);
    return res.tiposEjercicio;
  }

  async listarGruposMusculares(): Promise<GrupoMuscular[]> {
    const query = `
      query {
        gruposMusculares {
          id
          nombre
          descripcion
        }
      }
    `;
    const res = await this.graphql.query<{ gruposMusculares: GrupoMuscular[] }>(query);
    return res.gruposMusculares;
  }

  async crearEjercicio(input: CrearEjercicioInput): Promise<Ejercicio> {
    const query = `
      mutation CrearEjercicio($input: CrearEjercicioInput!) {
        crearEjercicio(input: $input) {
          id
          nombre
          nivelDificultad
          tipoEjercicio {
            nombre
          }
        }
      }
    `;
    const res = await this.graphql.query<{ crearEjercicio: Ejercicio }>(query, { input });
    return res.crearEjercicio;
  }
}
