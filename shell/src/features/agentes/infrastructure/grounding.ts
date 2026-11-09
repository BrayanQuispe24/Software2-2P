type Facts = { nombre?: string; valor_actual: number | null; valor_referencia?: number | null;
  unidad?: string; confiable: boolean; metadata?: Record<string, unknown> };

function numericValues(value: unknown): number[] {
  if (typeof value === 'number' && Number.isFinite(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(numericValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(numericValues);
  return [];
}

export function matchesNumericEvidence(text: string, value: number, facts: unknown, percentages: number[]): boolean {
  const numbers = [...text.matchAll(/-?\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
  const allowed = numericValues(facts);
  // Conservative: the answer must start with the observed value, not capacity or a threshold.
  if (!numbers.length || numbers[0] !== value || numbers.some((n) => !allowed.includes(n))) return false;
  return [...text.matchAll(/(-?\d+(?:[.,]\d+)?)\s*(?:%|por\s+ciento)/gi)].every((m) => percentages.includes(Number(m[1].replace(',', '.'))));
}

export function verifiedSummary(facts: Facts): string {
  if (!facts.confiable || facts.valor_actual == null) {
    return `${facts.nombre ?? 'Indicador'}: sin datos disponibles. ${facts.metadata?.error ?? ''}`.trim();
  }
  let summary = `${facts.nombre ?? 'Indicador'}: ${facts.valor_actual}${facts.unidad === '%' ? '%' : ` ${facts.unidad ?? ''}`}.`;
  const metadata = facts.metadata ?? {};
  if (typeof metadata.presentes === 'number' && typeof metadata.capacidad_total === 'number')
    summary += ` Personas presentes: ${metadata.presentes}. Capacidad configurada: ${metadata.capacidad_total} plazas.`;
  if (metadata.metodo === 'REGLA_INACTIVIDAD') summary += ' Indicador de inactividad observado; no es una predicción ML.';
  return summary;
}
