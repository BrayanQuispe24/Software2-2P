export interface AlertaData {
  id: string;
  titulo: string;
  agente_tipo: string;
  severidad: string;
  estado: string;
  valor_observado: number;
  valor_referencia?: number;
  condicion_activadora: string;
  explicacion: string;
  recomendacion: string;
  origen_explicacion?: string;
  modelo_ia_browser?: string;
  grado_confianza: number;
  evidencia?: Record<string, any>;
  evidencia_hash?: string;
  created_at?: string;
}
