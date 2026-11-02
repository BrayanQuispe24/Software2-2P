import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { RutinaRepositoryPort } from '../domain/ports/rutina-repository.port';
import { Rutina, CrearRutinaInput } from '../domain/models/rutina.model';

@Injectable({
  providedIn: 'root',
})
export class GraphQLRutinaRepository implements RutinaRepositoryPort {
  constructor(private readonly graphql: GraphQLClientService) {}

  async listarRutinas(nivel?: string): Promise<Rutina[]> {
    const query = `
      query ListarRutinas($nivel: String) {
        rutinas(nivel: $nivel, estado: true) {
          id
          nombre
          descripcion
          nivel
          estado
          rutinaEjercicios {
            id
            series
            repeticiones
            peso
            duracionSegundos
            descansoSegundos
            orden
            observacion
            ejercicio {
              id
              nombre
              nivelDificultad
              tipoEjercicio {
                nombre
              }
            }
          }
        }
      }
    `;
    const res = await this.graphql.query<{ rutinas: Rutina[] }>(query, { nivel });
    return res.rutinas;
  }

  async obtenerRutinaPorId(id: string): Promise<Rutina | null> {
    const query = `
      query RutinaPorId($id: ID!) {
        rutinaPorId(id: $id) {
          id
          nombre
          descripcion
          nivel
          estado
          rutinaEjercicios {
            id
            series
            repeticiones
            peso
            orden
            ejercicio {
              id
              nombre
            }
          }
        }
      }
    `;
    const res = await this.graphql.query<{ rutinaPorId: Rutina | null }>(query, { id });
    return res.rutinaPorId;
  }

  async crearRutina(input: CrearRutinaInput): Promise<Rutina> {
    const query = `
      mutation CrearRutina($input: CrearRutinaInput!) {
        crearRutina(input: $input) {
          id
          nombre
          nivel
          estado
        }
      }
    `;
    const res = await this.graphql.query<{ crearRutina: Rutina }>(query, { input });
    return res.crearRutina;
  }
}
