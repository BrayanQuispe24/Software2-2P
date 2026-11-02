export interface DetallePlanAlimentacion {
  id?: string;
  diaSemana: string;
  tipoComida: string; // DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION
  alimento: string;
  cantidad: number;
  unidad: string;
  hora?: string;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
  observacion?: string;
}

export interface PlanAlimentacion {
  id: string;
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  observacion?: string;
  estado: boolean;
  comidas: DetallePlanAlimentacion[];
}

export interface ComidaInput {
  diaSemana: string;
  tipoComida: string;
  alimento: string;
  cantidad: number;
  unidad: string;
  hora?: string;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
  observacion?: string;
}

export interface AsignarPlanAlimentacionInput {
  idUsuario: string;
  nombre: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  observacion?: string;
  comidas: ComidaInput[];
}
