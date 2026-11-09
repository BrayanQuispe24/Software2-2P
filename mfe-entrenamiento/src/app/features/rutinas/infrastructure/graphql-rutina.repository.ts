import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { RutinaRepositoryPort } from '../domain/ports/rutina-repository.port';
import { Rutina, CrearRutinaInput, RutinaPersonalizada, GuardarRutinaPersonalizadaInput } from '../domain/models/rutina.model';

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

  async listarRutinasPersonalizadasPorUsuario(usuarioId: string): Promise<RutinaPersonalizada[]> {
    const query = `
      query RutinasPersonalizadasPorUsuario($usuarioId: ID!) {
        rutinasPersonalizadasPorUsuario(usuarioId: $usuarioId) {
          id
          usuarioId
          nombre
          descripcion
          objetivo
          tipoEntrenamiento
          nivel
          estado
          duracionEstimadaMinutos
          bloques {
            orden
            nombre
            tipoBloque
            metodo
            protocolo
            rondas
            intervaloTrabajoSeg
            intervaloDescansoSeg
            ejercicios {
              ejercicioId
              nombre
              series
              repeticiones
              pesoKg
              duracionSegundos
              descansoSegundos
              notaTecnica
              seriesDetalle {
                set
                repeticiones
                pesoKg
                rpeObjetivo
                duracionSegundos
                descansoSegundos
                nota
              }
            }
          }
          createdAt
          updatedAt
        }
      }
    `;
    const res = await this.graphql.query<{ rutinasPersonalizadasPorUsuario: RutinaPersonalizada[] }>(query, { usuarioId });
    return res.rutinasPersonalizadasPorUsuario;
  }

  async obtenerRutinaPersonalizadaPorId(id: string): Promise<RutinaPersonalizada | null> {
    const query = `
      query RutinaPersonalizadaPorId($id: ID!) {
        rutinaPersonalizadaPorId(id: $id) {
          id
          usuarioId
          nombre
          descripcion
          objetivo
          tipoEntrenamiento
          nivel
          estado
          duracionEstimadaMinutos
          bloques {
            orden
            nombre
            tipoBloque
            metodo
            protocolo
            rondas
            ejercicios {
              ejercicioId
              nombre
              series
              repeticiones
              pesoKg
              duracionSegundos
              descansoSegundos
              notaTecnica
            }
          }
        }
      }
    `;
    const res = await this.graphql.query<{ rutinaPersonalizadaPorId: RutinaPersonalizada | null }>(query, { id });
    return res.rutinaPersonalizadaPorId;
  }

  async guardarRutinaPersonalizada(input: GuardarRutinaPersonalizadaInput): Promise<RutinaPersonalizada> {
    const query = `
      mutation GuardarRutinaPersonalizada($input: GuardarRutinaPersonalizadaInput!) {
        guardarRutinaPersonalizada(input: $input) {
          id
          usuarioId
          nombre
          objetivo
          tipoEntrenamiento
          nivel
          estado
          duracionEstimadaMinutos
        }
      }
    `;
    const res = await this.graphql.query<{ guardarRutinaPersonalizada: RutinaPersonalizada }>(query, { input });
    return res.guardarRutinaPersonalizada;
  }

  async eliminarRutinaPersonalizada(id: string): Promise<boolean> {
    const query = `
      mutation EliminarRutinaPersonalizada($id: ID!) {
        eliminarRutinaPersonalizada(id: $id)
      }
    `;
    const res = await this.graphql.query<{ eliminarRutinaPersonalizada: boolean }>(query, { id });
    return res.eliminarRutinaPersonalizada;
  }
}
