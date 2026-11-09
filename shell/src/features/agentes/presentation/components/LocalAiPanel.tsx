import { useEffect, useState } from 'react';
import axios from 'axios';
import { browserAiEngine, LOCAL_MODELS, type AiState } from '../../infrastructure/browserAiEngine';
import type { AlertaData } from '../../infrastructure/alertaData';
import { verifiedSummary } from '../../infrastructure/grounding';

export function LocalAiPanel({ alerts, onSaved }: { alerts: AlertaData[]; onSaved: () => Promise<void> }) {
  const [state, setState] = useState<AiState | null>(null);
  const [model, setModel] = useState(LOCAL_MODELS[0]?.model_id ?? '');
  const [cached, setCached] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [alertId, setAlertId] = useState('');
  const [draft, setDraft] = useState<{ id: string; hash: string; model: string; text: string; recommendation: string } | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerSource, setAnswerSource] = useState('');
  const [trace, setTrace] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => browserAiEngine.subscribe(setState), []);
  useEffect(() => {
    let active = true;
    setCached(null);
    browserAiEngine.cached(model).then((value) => { if (active) setCached(value); }).catch(() => {});
    return () => { active = false; };
  }, [model, state?.loadedModel]);
  const run = async (operation: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : 'La operación falló.'); }
    finally { setBusy(false); }
  };
  const alert = alerts.find((a) => a.id === alertId);
  const working = busy || state?.loading || state?.generating;
  return <section className="local-ai-panel">
    <h2>IA local en este dispositivo</h2>
    <p>El modelo se descarga al navegador y genera sugerencias a partir de los datos consultados. Revisa las respuestas antes de guardarlas.</p>
    <div className="local-ai-controls">
      <label>Modelo <select value={model} onChange={(e) => setModel(e.target.value)} disabled={working}>
        {LOCAL_MODELS.map((m) => <option key={m.model_id} value={m.model_id}>{m.model_id}</option>)}
      </select></label>
      <button className="btn-primary" disabled={working || !state?.supported || !model}
        onClick={() => run(async () => { await browserAiEngine.load(model); })}>
        {state?.loading ? 'Cargando…' : state?.loadedModel ? 'Cambiar / cargar modelo' : 'Cargar modelo'}
      </button>
    </div>
    <p role="status">{state?.supported ? 'WebGPU disponible' : 'WebGPU no disponible: continúan activas las reglas de monitoreo.'}
      {cached !== null && ` · ${cached ? 'Pesos del modelo en caché' : 'El modelo necesita descargarse'}`}</p>
    <p>{state?.status}</p>
    {state?.loading && <progress max={100} value={state.progress} aria-label="Progreso real de carga del modelo" />}
    {state?.loadedModel && <p>Modelo en memoria: <strong>{state.loadedModel}</strong>
      {state.tokensPerSecond != null && ` · ${state.tokensPerSecond.toFixed(1)} tokens/s`}</p>}
    <div className="local-ai-controls">
      <label>Alerta <select value={alertId} onChange={(e) => setAlertId(e.target.value)} disabled={working}>
        <option value="">Selecciona una alerta</option>
        {alerts.map((a) => <option key={a.id} value={a.id}>{a.titulo}</option>)}
      </select></label>
      <button className="btn-secondary" disabled={working || !state?.loadedModel || !alert?.evidencia_hash}
        onClick={() => run(async () => {
          if (!alert?.evidencia_hash) return;
          setDraft(null);
          const result = await browserAiEngine.explain(alert, setAnswer);
          setDraft({ id: alert.id, hash: alert.evidencia_hash, model: result.model!, text: result.text, recommendation: alert.recomendacion });
        })}>Analizar alerta</button>
    </div>
    {draft && <div className="local-ai-draft">
      <label>Explicación para revisar<textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>
      <label>Recomendación para revisar<textarea value={draft.recommendation} onChange={(e) => setDraft({ ...draft, recommendation: e.target.value })} /></label>
      <button className="btn-primary" disabled={working} onClick={() => run(async () => {
        await axios.patch(`/api/agentes/alertas/${draft.id}/explicacion-ia`, {
          explicacion: draft.text, recomendacion: draft.recommendation, evidencia_hash: draft.hash,
          modelo_ia_browser: draft.model, tokens_segundo: state?.tokensPerSecond,
        });
        await onSaved(); setDraft(null); setAnswer('Explicación guardada y auditada.');
      })}>Guardar explicación revisada</button>
    </div>}
    <form onSubmit={(e) => { e.preventDefault(); run(async () => {
      setDraft(null); setAnswer('');
      const result = await browserAiEngine.suggestTool(question);
      setTrace(result);
      const interpretation = await browserAiEngine.interpret(question, result);
      setAnswer(interpretation.text);
      setAnswerSource(interpretation.source);
    }); }}>
      <label>Consultar al asistente<input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000} required placeholder="Pregunta sobre aforo, equipos o membresías" /></label>
      <button className="btn-secondary" disabled={working || !state?.loadedModel}>Consultar datos y analizar</button>
    </form>
    {answer && <div><p><strong>{answerSource || 'Respuesta para revisar'}</strong></p><p className="local-ai-answer">{answer}</p></div>}
    {trace != null && <div><p><strong>Datos verificados:</strong> {verifiedSummary((trace as { resultado: any }).resultado)}</p>
      <details><summary>Datos utilizados en la respuesta</summary><pre>{JSON.stringify(trace, null, 2)}</pre></details></div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
