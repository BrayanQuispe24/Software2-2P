export interface Disciplina {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  capacidadMaxima: number;
  colorHex?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  horarios?: DisciplinaHorario[];
}

export interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  turno: string;
  capacidadAforo: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DisciplinaHorario {
  id: string;
  disciplina?: Disciplina;
  horario?: Horario;
  instructorId?: string;
  cupoDisponible: number;
  activo: boolean;
}
