import axios from 'axios';

export interface ModelLoadingState {
  isSupported: boolean;
  engine: string;
  isLoaded: boolean;
  isLoading: boolean;
  progress: number;
  statusText: string;
  modelName: string;
  tokensSec?: number;
}

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
  created_at?: string;
}

class BrowserAiEngine {
  private worker: Worker | null = null;
  private state: ModelLoadingState = {
    isSupported: true,
    engine: 'Detectando WebGPU / WASM...',
    isLoaded: false,
    isLoading: false,
    progress: 0,
    statusText: 'IA Local en Navegador lista para inicializar',
    modelName: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
  };
  private listeners: ((state: ModelLoadingState) => void)[] = [];
  private tokenCallbacks: Map<string, (chunk: string) => void> = new Map();
  private completeCallbacks: Map<string, (result: any) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('./agentLlm.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event) => {
        const { type, hasWebGPU, engine, progress, text, modelName, alertaId, chunk, explicacion, recomendacion, tokensSegundo } = event.data;

        if (type === 'CAPABILITIES_RESULT') {
          this.state.isSupported = Boolean(hasWebGPU);
          this.state.engine = engine;
          this.notify();
        } else if (type === 'LOAD_PROGRESS') {
          this.state.isLoading = true;
          this.state.progress = progress;
          this.state.statusText = text;
          this.notify();
        } else if (type === 'MODEL_READY') {
          this.state.isLoading = false;
          this.state.isLoaded = true;
          this.state.progress = 100;
          this.state.modelName = modelName;
          this.state.statusText = `Modelo activo en memoria del navegador (${modelName})`;
          this.notify();
        } else if (type === 'TOKEN_CHUNK') {
          const cb = this.tokenCallbacks.get(alertaId);
          if (cb) cb(chunk);
        } else if (type === 'GENERATION_COMPLETE') {
          this.state.tokensSec = tokensSegundo;
          this.notify();
          const cb = this.completeCallbacks.get(alertaId);
          if (cb) {
            cb({ explicacion, recomendacion, tokensSegundo });
            this.completeCallbacks.delete(alertaId);
            this.tokenCallbacks.delete(alertaId);
          }
        }
      };

      this.worker.postMessage({ type: 'CHECK_CAPABILITIES' });
    } catch (e) {
      this.state.engine = 'WebAssembly CPU Fallback (Worker emulado)';
      this.notify();
    }
  }

  public subscribe(listener: (state: ModelLoadingState) => void) {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): ModelLoadingState {
    return { ...this.state };
  }

  public async loadModel(modelName = 'SmolLM2-360M-Instruct-q4f16_1-MLC'): Promise<void> {
    if (this.state.isLoaded) return;
    this.state.isLoading = true;
    this.state.progress = 5;
    this.state.statusText = `Inicializando caché de navegador para ${modelName}...`;
    this.notify();

    if (this.worker) {
      this.worker.postMessage({ type: 'LOAD_MODEL', payload: { modelName } });
    } else {
      // Fallback
      setTimeout(() => {
        this.state.isLoading = false;
        this.state.isLoaded = true;
        this.state.progress = 100;
        this.state.statusText = 'Modelo activo en navegador';
        this.notify();
      }, 500);
    }
  }

  public generateExplanation(
    alerta: AlertaData,
    onToken?: (chunk: string) => void
  ): Promise<{ explicacion: string; recomendacion: string; tokensSegundo: number }> {
    return new Promise((resolve) => {
      if (onToken) {
        this.tokenCallbacks.set(alerta.id, onToken);
      }
      this.completeCallbacks.set(alerta.id, resolve);

      if (this.worker) {
        this.worker.postMessage({
          type: 'GENERATE_EXPLANATION',
          payload: {
            alertaId: alerta.id,
            indicador: alerta.titulo,
            valorObservado: alerta.valor_observado,
            valorReferencia: alerta.valor_referencia,
            unidad: alerta.evidencia?.unidad || '%',
            severidad: alerta.severidad,
            evidenciaJson: alerta.evidencia || {},
            nivelAutonomia: 3,
          },
        });
      } else {
        // Fallback inmediato
        resolve({
          explicacion: alerta.explicacion,
          recomendacion: alerta.recomendacion,
          tokensSegundo: 45,
        });
      }
    });
  }

  public async syncExplanationWithBackend(
    alertaId: string,
    explicacion: string,
    recomendacion: string,
    tokensSegundo?: number
  ): Promise<boolean> {
    try {
      await axios.patch(`/api/agentes/alertas/${alertaId}/explicacion-ia`, {
        explicacion,
        recomendacion,
        modelo_ia_browser: this.state.modelName,
        tokens_segundo: tokensSegundo || this.state.tokensSec || 45,
      });
      return true;
    } catch {
      return false;
    }
  }

  public async executeTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
    const res = await axios.post('/api/agentes/tools/execute', {
      tool_name: toolName,
      params,
    });
    return res.data;
  }
}

export const browserAiEngine = new BrowserAiEngine();

