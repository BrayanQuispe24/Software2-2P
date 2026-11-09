import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesNumericEvidence, verifiedSummary } from '../src/features/agentes/infrastructure/grounding.ts';

const facts = { nombre: 'Aforo', valor_actual: 93, valor_referencia: 100, unidad: '%', confiable: true,
  metadata: { presentes: 119, capacidad_total: 128 } };

test('accepts the measured percentage and actual counts', () => {
  assert.equal(matchesNumericEvidence('93% de ocupación: 119 personas en 128 plazas.', 93, facts, [93, 100]), true);
});
test('rejects invented numbers', () => {
  assert.equal(matchesNumericEvidence('93% de ocupación con 120 personas.', 93, facts, [93, 100]), false);
});
test('does not confuse capacity with occupancy', () => {
  assert.equal(matchesNumericEvidence('128% de ocupación.', 93, facts, [93, 100]), false);
});
test('rejects counts presented as percentages', () => {
  assert.equal(matchesNumericEvidence('93% de ocupación; capacidad del 128%.', 93, facts, [93, 100]), false);
});
test('accepts decimal commas grounded in evidence', () => {
  assert.equal(matchesNumericEvidence('93,5 por ciento de ocupación.', 93.5, { valor_actual: 93.5 }, [93.5]), true);
});
test('keeps the sign of negative enrollment variation', () => {
  assert.equal(matchesNumericEvidence('-75% de variación.', -75, { valor_actual: -75 }, [-75]), true);
  assert.equal(matchesNumericEvidence('75% de variación.', -75, { valor_actual: -75 }, [-75]), false);
});
test('unavailable data has no invented measurement', () => {
  assert.match(verifiedSummary({ nombre: 'Aforo', valor_actual: null, confiable: false, metadata: { error: 'Fuente no disponible' } }), /sin datos disponibles/);
});
test('labels the inactivity fallback without claiming an ML prediction', () => {
  assert.match(verifiedSummary({ nombre: 'Retención', valor_actual: 20, unidad: '%', confiable: true,
    metadata: { metodo: 'REGLA_INACTIVIDAD' } }), /no es una predicción ML/);
});
