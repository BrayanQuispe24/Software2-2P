import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../core/graphql/graphql.client';
import { AntropometriaRepositoryPort } from '../domain/ports/antropometria-repository.port';
import { Historial, DetalleHistorial, RegistrarMedicionInput } from '../domain/models/antropometria.model';

@Injectable({
  providedIn: 'root',
})
export class GraphQLAntropometriaRepository implements AntropometriaRepositoryPort {
  constructor(private readonly graphql: GraphQLClientService) {}

  async obtenerHistorial(usuarioId: string): Promise<Historial | null> {
    const query = `
      query HistorialPorUsuario($usuarioId: ID!) {
        historialPorUsuario(usuarioId: $usuarioId) {
          id
          idUsuario
          fechaApertura
          grupoSanguineo
          sexo
          fechaNacimiento
          domicilio
          facultadCarrera
          celularEmergencia
          observacionesGenerales
          detalles {
            id
            peso
            altura
            imc
            porcentajeGasa
            masaMuscular
            presion
            fechaRegistro
          }
        }
      }
    `;
    const res = await this.graphql.query<{ historialPorUsuario: Historial | null }>(query, { usuarioId });
    return res.historialPorUsuario;
  }

  async registrarMedicion(input: RegistrarMedicionInput): Promise<DetalleHistorial> {
    const query = `
      mutation RegistrarMedicion($input: RegistrarMedicionInput!) {
        registrarMedicionProgreso(input: $input) {
          id
          peso
          altura
          imc
          porcentajeGasa
          masaMuscular
          presion
          fechaRegistro
        }
      }
    `;
    const res = await this.graphql.query<{ registrarMedicionProgreso: DetalleHistorial }>(query, { input });
    return res.registrarMedicionProgreso;
  }
}
