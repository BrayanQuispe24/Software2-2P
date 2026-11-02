import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../../core/graphql/graphql.client';
import {
  IControlAccesoRepository,
  ValidarAccesoTorniqueteInput,
} from '../../domain/repositories/control-acceso.repository';
import { RegistroAcceso, ValidacionAccesoResult } from '../../domain/models/acceso.model';

@Injectable({
  providedIn: 'root',
})
export class ControlAccesoGraphQLRepository implements IControlAccesoRepository {
  constructor(private readonly client: GraphQLClientService) {}

  async validarAccesoTorniquete(input: ValidarAccesoTorniqueteInput): Promise<ValidacionAccesoResult> {
    const mutation = `
      mutation ValidarAccesoTorniquete($input: ValidarAccesoTorniqueteInput!) {
        validarAccesoTorniquete(input: $input) {
          permitido
          mensaje
          clienteId
          codigoMatricula
          planNombre
          sesionesRestantes
          diasRestantes
          registroAcceso {
            id
            tipoMovimiento
            estadoAcceso
            fechaHora
            dispositivoTorniquete
            motivoDenegacion
          }
        }
      }
    `;
    const res = await this.client.query<{ validarAccesoTorniquete: ValidacionAccesoResult }>(mutation, { input });
    return res.validarAccesoTorniquete;
  }

  async validarAccesoPorQr(input: import('../../domain/repositories/control-acceso.repository').ValidarAccesoQrInput): Promise<ValidacionAccesoResult> {
    const mutation = `
      mutation ValidarAccesoPorQr($input: ValidarAccesoQrInput!) {
        validarAccesoPorQr(input: $input) {
          permitido
          mensaje
          clienteId
          codigoMatricula
          planNombre
          sesionesRestantes
          diasRestantes
          registroAcceso {
            id
            tipoMovimiento
            estadoAcceso
            fechaHora
            dispositivoTorniquete
            motivoDenegacion
          }
        }
      }
    `;
    const res = await this.client.query<{ validarAccesoPorQr: ValidacionAccesoResult }>(mutation, { input });
    return res.validarAccesoPorQr;
  }

  async obtenerQrPaseDigital(inscripcionId: string): Promise<string> {
    const query = `
      query ObtenerQrPaseDigital($inscripcionId: ID!) {
        obtenerQrPaseDigital(inscripcionId: $inscripcionId)
      }
    `;
    const res = await this.client.query<{ obtenerQrPaseDigital: string }>(query, { inscripcionId });
    return res.obtenerQrPaseDigital;
  }

  async listarRegistrosAcceso(clienteId?: string, limite: number = 50): Promise<RegistroAcceso[]> {
    const query = `
      query GetRegistrosAcceso($clienteId: ID, $limite: Int) {
        registrosAcceso(clienteId: $clienteId, limite: $limite) {
          id
          clienteId
          tipoMovimiento
          estadoAcceso
          fechaHora
          dispositivoTorniquete
          motivoDenegacion
        }
      }
    `;
    const res = await this.client.query<{ registrosAcceso: RegistroAcceso[] }>(query, { clienteId, limite });
    return res.registrosAcceso;
  }
}
