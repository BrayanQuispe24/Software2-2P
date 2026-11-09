import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

export function RuleEditor({ rule, onClose, onSaved }: { rule: any; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ umbral_preventivo: rule.umbral_preventivo, umbral_critico: rule.umbral_critico,
    umbral_cierre_histeresis: rule.umbral_cierre_histeresis ?? '', cooldown_seg: rule.cooldown_seg,
    duracion_minima_seg: rule.duracion_minima_seg ?? 0, horario_inicio: rule.horario_inicio ?? '',
    horario_fin: rule.horario_fin ?? '', nivel_autonomia: rule.nivel_autonomia, activa: rule.activa,
    destinatarios: (rule.destinatarios ?? []).join(', ') });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, []);
  return createPortal(<dialog ref={dialog} className="rule-editor-dialog" aria-labelledby="rule-editor-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
  <form className="local-ai-panel" onSubmit={async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await axios.put(`/api/agentes/reglas/${rule.id}`, { ...form,
        umbral_cierre_histeresis: form.umbral_cierre_histeresis === '' ? null : Number(form.umbral_cierre_histeresis),
        horario_inicio: form.horario_inicio || null, horario_fin: form.horario_fin || null,
        destinatarios: form.destinatarios.split(',').map((v: string) => v.trim()).filter(Boolean),
      });
      await onSaved(); onClose();
    } catch (e: any) { setError(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Revisa los valores de la regla.'); }
    finally { setBusy(false); }
  }}>
    <h3 id="rule-editor-title">Editar {rule.nombre}</h3>
    <div className="rule-editor-fields">
      {(['umbral_preventivo', 'umbral_critico', 'umbral_cierre_histeresis', 'cooldown_seg', 'duracion_minima_seg'] as const).map((key) =>
        <label key={key}>{({ umbral_preventivo: 'Umbral preventivo', umbral_critico: 'Umbral crítico', umbral_cierre_histeresis: 'Umbral de cierre', cooldown_seg: 'Espera entre avisos (s)', duracion_minima_seg: 'Duración mínima de la anomalía (s)' })[key]}
          <input type="number" step="any" required={key !== 'umbral_cierre_histeresis'} value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) })} /></label>)}
      <label>Desde (hora de Bolivia)<input type="time" value={form.horario_inicio} onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })} /></label>
      <label>Hasta<input type="time" value={form.horario_fin} onChange={(e) => setForm({ ...form, horario_fin: e.target.value })} /></label>
      <label>Autonomía<select value={form.nivel_autonomia} onChange={(e) => setForm({ ...form, nivel_autonomia: Number(e.target.value) })}>
        <option value={0}>0 — Observar</option><option value={1}>1 — Alertar</option><option value={2}>2 — Recomendar</option>
        <option value={3}>3 — Notificar</option><option value={4}>4 — Solicitar aprobación</option>
      </select></label>
      <label>Destinatarios (separados por comas)<input value={form.destinatarios} onChange={(e) => setForm({ ...form, destinatarios: e.target.value })} /></label>
      <label className="rule-editor-active"><input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} /> Activa</label>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="rule-editor-actions">
      <button className="btn-secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
      <button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar regla'}</button>
    </div>
  </form></dialog>, document.body);
}
