import { Injectable } from '@angular/core';
import { GraphQLClientService } from '../../../../core/graphql/graphql.client';
import {
  ICatalogoRepository,
  CrearDisciplinaInput,
  ActualizarDisciplinaInput,
  CrearHorarioInput,
  ActualizarHorarioInput,
  AsignarDisciplinaHorarioInput,
  CrearPlanInput,
  ActualizarPlanInput,
  CrearTarifaInput,
  ActualizarTarifaInput,
} from '../../domain/repositories/catalogo.repository';
import { Disciplina, Horario, DisciplinaHorario } from '../../domain/models/disciplina.model';
import { Plan, Tarifa } from '../../domain/models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogoGraphQLRepository implements ICatalogoRepository {
  constructor(private readonly client: GraphQLClientService) {}

  async listarDisciplinas(soloActivas: boolean = true): Promise<Disciplina[]> {
    const query = `
      query GetDisciplinas($soloActivas: Boolean) {
        disciplinas(soloActivas: $soloActivas) {
          id
          codigo
          nombre
          descripcion
          capacidadMaxima
          colorHex
          activo
          createdAt
          horarios {
            id
            cupoDisponible
            activo
            horario {
              id
              diaSemana
              horaInicio
              horaFin
              turno
            }
          }
        }
      }
    `;
    const res = await this.client.query<{ disciplinas: Disciplina[] }>(query, { soloActivas });
    return res.disciplinas;
  }

  async listarHorarios(soloActivos: boolean = true): Promise<Horario[]> {
    const query = `
      query GetHorarios($soloActivos: Boolean) {
        horarios(soloActivos: $soloActivos) {
          id
          diaSemana
          horaInicio
          horaFin
          turno
          capacidadAforo
          activo
        }
      }
    `;
    const res = await this.client.query<{ horarios: Horario[] }>(query, { soloActivos });
    return res.horarios;
  }

  async listarDisciplinaHorarios(disciplinaId?: string): Promise<DisciplinaHorario[]> {
    const query = `
      query GetDisciplinaHorarios($disciplinaId: ID) {
        disciplinaHorarios(disciplinaId: $disciplinaId) {
          id
          cupoDisponible
          activo
          disciplina {
            id
            nombre
            codigo
          }
          horario {
            id
            diaSemana
            horaInicio
            horaFin
            turno
          }
        }
      }
    `;
    const res = await this.client.query<{ disciplinaHorarios: DisciplinaHorario[] }>(query, { disciplinaId });
    return res.disciplinaHorarios;
  }

  async crearDisciplina(input: CrearDisciplinaInput): Promise<Disciplina> {
    const mutation = `
      mutation CrearDisciplina($input: CrearDisciplinaInput!) {
        crearDisciplina(input: $input) {
          id
          codigo
          nombre
          descripcion
          capacidadMaxima
          colorHex
          activo
        }
      }
    `;
    const res = await this.client.query<{ crearDisciplina: Disciplina }>(mutation, { input });
    return res.crearDisciplina;
  }

  async actualizarDisciplina(id: string, input: ActualizarDisciplinaInput): Promise<Disciplina> {
    const mutation = `
      mutation ActualizarDisciplina($id: ID!, $input: ActualizarDisciplinaInput!) {
        actualizarDisciplina(id: $id, input: $input) {
          id
          codigo
          nombre
          descripcion
          capacidadMaxima
          colorHex
          activo
        }
      }
    `;
    const res = await this.client.query<{ actualizarDisciplina: Disciplina }>(mutation, { id, input });
    return res.actualizarDisciplina;
  }

  async eliminarDisciplina(id: string): Promise<boolean> {
    const mutation = `
      mutation EliminarDisciplina($id: ID!) {
        eliminarDisciplina(id: $id)
      }
    `;
    const res = await this.client.query<{ eliminarDisciplina: boolean }>(mutation, { id });
    return res.eliminarDisciplina;
  }

  async actualizarAforoDisciplina(id: string, capacidadMaxima: number): Promise<Disciplina> {
    const mutation = `
      mutation ActualizarAforoDisciplina($id: ID!, $capacidadMaxima: Int!) {
        actualizarAforoDisciplina(id: $id, capacidadMaxima: $capacidadMaxima) {
          id
          nombre
          capacidadMaxima
        }
      }
    `;
    const res = await this.client.query<{ actualizarAforoDisciplina: Disciplina }>(mutation, { id, capacidadMaxima });
    return res.actualizarAforoDisciplina;
  }

  async actualizarCupoHorario(disciplinaHorarioId: string, cupoDisponible: number): Promise<DisciplinaHorario> {
    const mutation = `
      mutation ActualizarCupoHorario($disciplinaHorarioId: ID!, $cupoDisponible: Int!) {
        actualizarCupoHorario(disciplinaHorarioId: $disciplinaHorarioId, cupoDisponible: $cupoDisponible) {
          id
          cupoDisponible
        }
      }
    `;
    const res = await this.client.query<{ actualizarCupoHorario: DisciplinaHorario }>(mutation, {
      disciplinaHorarioId,
      cupoDisponible,
    });
    return res.actualizarCupoHorario;
  }

  async crearHorario(input: CrearHorarioInput): Promise<Horario> {
    const mutation = `
      mutation CrearHorario($input: CrearHorarioInput!) {
        crearHorario(input: $input) {
          id
          diaSemana
          horaInicio
          horaFin
          turno
          capacidadAforo
          activo
        }
      }
    `;
    const res = await this.client.query<{ crearHorario: Horario }>(mutation, { input });
    return res.crearHorario;
  }

  async actualizarHorario(id: string, input: ActualizarHorarioInput): Promise<Horario> {
    const mutation = `
      mutation ActualizarHorario($id: ID!, $input: ActualizarHorarioInput!) {
        actualizarHorario(id: $id, input: $input) {
          id
          diaSemana
          horaInicio
          horaFin
          turno
          capacidadAforo
          activo
        }
      }
    `;
    const res = await this.client.query<{ actualizarHorario: Horario }>(mutation, { id, input });
    return res.actualizarHorario;
  }

  async asignarDisciplinaHorario(input: AsignarDisciplinaHorarioInput): Promise<DisciplinaHorario> {
    const mutation = `
      mutation AsignarDisciplinaHorario($input: AsignarDisciplinaHorarioInput!) {
        asignarDisciplinaHorario(input: $input) {
          id
          cupoDisponible
          activo
          horario {
            id
            diaSemana
            horaInicio
            horaFin
            turno
          }
        }
      }
    `;
    const res = await this.client.query<{ asignarDisciplinaHorario: DisciplinaHorario }>(mutation, { input });
    return res.asignarDisciplinaHorario;
  }

  async eliminarDisciplinaHorario(disciplinaHorarioId: string): Promise<boolean> {
    const mutation = `
      mutation EliminarDisciplinaHorario($disciplinaHorarioId: ID!) {
        eliminarDisciplinaHorario(disciplinaHorarioId: $disciplinaHorarioId)
      }
    `;
    const res = await this.client.query<{ eliminarDisciplinaHorario: boolean }>(mutation, { disciplinaHorarioId });
    return res.eliminarDisciplinaHorario;
  }

  async listarPlanes(soloActivos: boolean = true): Promise<Plan[]> {
    const query = `
      query GetPlanes($soloActivos: Boolean) {
        planes(soloActivos: $soloActivos) {
          id
          codigo
          nombre
          descripcion
          duracionDias
          sesionesTotales
          tipoAcceso
          activo
          tarifas {
            id
            nombre
            monto
            moneda
            matriculaInscripcion
            fechaInicio
            activa
          }
        }
      }
    `;
    const res = await this.client.query<{ planes: Plan[] }>(query, { soloActivos });
    return res.planes;
  }

  async crearPlan(input: CrearPlanInput): Promise<Plan> {
    const mutation = `
      mutation CrearPlan($input: CrearPlanInput!) {
        crearPlan(input: $input) {
          id
          codigo
          nombre
          descripcion
          duracionDias
          sesionesTotales
          tipoAcceso
          activo
        }
      }
    `;
    const res = await this.client.query<{ crearPlan: Plan }>(mutation, { input });
    return res.crearPlan;
  }

  async actualizarPlan(id: string, input: ActualizarPlanInput): Promise<Plan> {
    const mutation = `
      mutation ActualizarPlan($id: ID!, $input: ActualizarPlanInput!) {
        actualizarPlan(id: $id, input: $input) {
          id
          codigo
          nombre
          descripcion
          duracionDias
          sesionesTotales
          tipoAcceso
          activo
        }
      }
    `;
    const res = await this.client.query<{ actualizarPlan: Plan }>(mutation, { id, input });
    return res.actualizarPlan;
  }

  async eliminarPlan(id: string): Promise<boolean> {
    const mutation = `
      mutation EliminarPlan($id: ID!) {
        eliminarPlan(id: $id)
      }
    `;
    const res = await this.client.query<{ eliminarPlan: boolean }>(mutation, { id });
    return res.eliminarPlan;
  }

  async crearTarifa(input: CrearTarifaInput): Promise<Tarifa> {
    const mutation = `
      mutation CrearTarifa($input: CrearTarifaInput!) {
        crearTarifa(input: $input) {
          id
          nombre
          monto
          moneda
          matriculaInscripcion
          fechaInicio
          activa
        }
      }
    `;
    const res = await this.client.query<{ crearTarifa: Tarifa }>(mutation, { input });
    return res.crearTarifa;
  }

  async actualizarTarifa(id: string, input: ActualizarTarifaInput): Promise<Tarifa> {
    const mutation = `
      mutation ActualizarTarifa($id: ID!, $input: ActualizarTarifaInput!) {
        actualizarTarifa(id: $id, input: $input) {
          id
          nombre
          monto
          moneda
          matriculaInscripcion
          fechaInicio
          fechaFin
          activa
        }
      }
    `;
    const res = await this.client.query<{ actualizarTarifa: Tarifa }>(mutation, { id, input });
    return res.actualizarTarifa;
  }

  async eliminarTarifa(id: string): Promise<boolean> {
    const mutation = `
      mutation EliminarTarifa($id: ID!) {
        eliminarTarifa(id: $id)
      }
    `;
    const res = await this.client.query<{ eliminarTarifa: boolean }>(mutation, { id });
    return res.eliminarTarifa;
  }
}
