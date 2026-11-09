const indicatorLabels: Record<string, string> = {
  DISPONIBILIDAD_EQUIPOS_PCT: 'Disponibilidad de equipos',
  VARIACION_MATRICULAS_PCT: 'Variación de matrículas',
  AFORO_PCT: 'Ocupación de aforo',
  OCUPACION_AFORO_PCT: 'Ocupación de aforo',
  CLIENTES_ALTO_RIESGO_PCT: 'Clientes con alto riesgo de abandono',
  CHURN_ALTO_RIESGO_PCT: 'Clientes con alto riesgo de abandono',
};

export function formatAlertCondition(condition: string): string {
  return condition.replace(/\b[A-Z][A-Z0-9_]*_PCT\b/g, (key) =>
    indicatorLabels[key] ?? key.replace(/_PCT$/, '').replaceAll('_', ' ').toLowerCase()
  ).replace(/(\d+)\.0+(?=%)/g, '$1');
}
