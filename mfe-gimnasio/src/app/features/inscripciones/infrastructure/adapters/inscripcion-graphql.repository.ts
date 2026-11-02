import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../../core/graphql/graphql.client';
import {
  IInscripcionRepository,
  IPagoRepository,
  ProcesarInscripcionInput,
  ConfirmarPagoInput,
} from '../../domain/repositories/inscripcion.repository';
import { BoletaInscripcion, BoletaPago } from '../../domain/models/inscripcion.model';
import { EstadoInscripcion } from '../../domain/enums/inscripcion.enums';

@Injectable({
  providedIn: 'root',
})
export class InscripcionGraphQLRepository implements IInscripcionRepository, IPagoRepository {
  constructor(private readonly client: GraphQLClientService) {}

  async listarInscripciones(clienteId?: string, estado?: EstadoInscripcion): Promise<BoletaInscripcion[]> {
    const query = `
      query GetInscripciones($clienteId: ID, $estado: EstadoInscripcion) {
        inscripciones(clienteId: $clienteId, estado: $estado) {
          id
          codigoMatricula
          clienteId
          fechaInicio
          fechaFin
          totalSesiones
          sesionesConsumidas
          estado
          createdAt
          plan {
            id
            nombre
            codigo
            duracionDias
            tipoAcceso
          }
          disciplina {
            id
            codigo
            nombre
            colorHex
          }
          disciplinaHorario {
            id
            cupoDisponible
            disciplina {
              id
              nombre
              codigo
              colorHex
            }
            horario {
              id
              diaSemana
              horaInicio
              horaFin
              turno
            }
          }
          boletaPago {
            id
            numeroComprobante
            montoSubtotal
            montoDescuento
            montoTotal
            metodoPago
            estado
            codigoTransaccionExterna
            fechaPago
          }
        }
      }
    `;
    const res = await this.client.query<{ inscripciones: BoletaInscripcion[] }>(query, { clienteId, estado });
    return res.inscripciones;
  }

  async procesarInscripcion(input: ProcesarInscripcionInput): Promise<BoletaInscripcion> {
    const mutation = `
      mutation ProcesarInscripcion($input: ProcesarInscripcionInput!) {
        procesarInscripcion(input: $input) {
          id
          codigoMatricula
          clienteId
          fechaInicio
          fechaFin
          totalSesiones
          sesionesConsumidas
          estado
          plan {
            id
            nombre
          }
          disciplina {
            id
            codigo
            nombre
            colorHex
          }
          disciplinaHorario {
            id
            cupoDisponible
            disciplina {
              id
              nombre
              codigo
              colorHex
            }
            horario {
              id
              diaSemana
              horaInicio
              horaFin
              turno
            }
          }
          boletaPago {
            id
            numeroComprobante
            montoTotal
            metodoPago
            estado
          }
        }
      }
    `;
    const res = await this.client.query<{ procesarInscripcion: BoletaInscripcion }>(mutation, { input });
    return res.procesarInscripcion;
  }

  async congelarInscripcion(id: string, motivo?: string): Promise<BoletaInscripcion> {
    const mutation = `
      mutation CongelarInscripcion($id: ID!, $motivo: String) {
        congelarInscripcion(id: $id, motivo: $motivo) {
          id
          codigoMatricula
          estado
        }
      }
    `;
    const res = await this.client.query<{ congelarInscripcion: BoletaInscripcion }>(mutation, { id, motivo });
    return res.congelarInscripcion;
  }

  async reactivarInscripcion(id: string): Promise<BoletaInscripcion> {
    const mutation = `
      mutation ReactivarInscripcion($id: ID!) {
        reactivarInscripcion(id: $id) {
          id
          codigoMatricula
          estado
        }
      }
    `;
    const res = await this.client.query<{ reactivarInscripcion: BoletaInscripcion }>(mutation, { id });
    return res.reactivarInscripcion;
  }

  async listarPagosPorCliente(clienteId: string): Promise<BoletaPago[]> {
    const query = `
      query GetPagosPorCliente($clienteId: ID!) {
        pagosPorCliente(clienteId: $clienteId) {
          id
          numeroComprobante
          montoSubtotal
          montoDescuento
          montoTotal
          metodoPago
          estado
          codigoTransaccionExterna
          fechaPago
          createdAt
        }
      }
    `;
    const res = await this.client.query<{ pagosPorCliente: BoletaPago[] }>(query, { clienteId });
    return res.pagosPorCliente;
  }

  async confirmarPago(input: ConfirmarPagoInput): Promise<BoletaPago> {
    const mutation = `
      mutation ConfirmarPago($input: ConfirmarPagoInput!) {
        confirmarPago(input: $input) {
          id
          numeroComprobante
          estado
          codigoTransaccionExterna
          fechaPago
          montoTotal
        }
      }
    `;
    const res = await this.client.query<{ confirmarPago: BoletaPago }>(mutation, { input });
    return res.confirmarPago;
  }
}
