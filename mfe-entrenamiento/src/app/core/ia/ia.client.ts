import { Injectable } from '@angular/core';

export interface PostureAnalysisItem {
  view_type: string;
  confidence_score: number;
  has_quality_issues: boolean;
  calculated_angles: Record<string, number>;
  observations: string[];
  shoulder_slope_degrees: number;
  hip_slope_degrees: number;
}

export interface VideoAnalysisItem {
  exercise_type: string;
  completed_reps: number;
  average_depth_angle: number;
  execution_score: number;
  execution_errors: string[];
}

export interface RecommendedExerciseDetail {
  exercise_id: string;
  exercise_name: string;
  body_part: string;
  muscle_type: string;
  equipment: string;
  difficulty: string;
  score: number;
}

export interface WorkoutDayDetail {
  day_number: number;
  day_label: string;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    target_sets: number;
    target_reps: number;
    rest_seconds: number;
    intensity_rpe: number;
    notes?: string;
  }>;
}

export interface WorkoutPlanDetail {
  program_name: string;
  status: string;
  trainer_review_notice: string;
  justification: string;
  days: WorkoutDayDetail[];
}

export interface StatelessAnalysisResponse {
  client_id: string;
  bmi: number;
  bmi_category: string;
  fitness_level: string;
  fitness_goal: string;
  posture_findings: string[];
  photo_analyses: PostureAnalysisItem[];
  video_analysis: VideoAnalysisItem | null;
  recommendation_engine: string;
  recommended_exercises: RecommendedExerciseDetail[];
  workout_plan: WorkoutPlanDetail;
  persisted_to_database: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IaClientService {
  private get isLocal(): boolean {
    return typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }

  private get gatewayUrl(): string {
    return this.isLocal ? 'http://localhost:3000/api/ia' : '/api/ia';
  }

  private get directFastApiUrl(): string {
    return this.isLocal ? 'http://localhost:8000/api/v1' : '/ia/deep/api/v1';
  }

  async analyzeAndRecommend(formData: FormData): Promise<StatelessAnalysisResponse> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Intento primario: a través de API Gateway
    try {
      const response = await fetch(`${this.gatewayUrl}/analyze-and-recommend`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Si el Gateway falla por red o CORS, recurrimos al servicio directo
    }

    // 2. Intento secundario: conexión directa con el motor de IA FastAPI (puerto 8000)
    try {
      const directResponse = await fetch(`${this.directFastApiUrl}/pipeline/analyze-and-recommend`, {
        method: 'POST',
        body: formData,
      });

      if (directResponse.ok) {
        return await directResponse.json();
      }

      const err = await directResponse.json().catch(() => null);
      const detail = err?.detail;
      const detailMsg = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'campo'}: ${d.msg}`).join(', ')
        : (typeof detail === 'string' ? detail : null);

      throw new Error(detailMsg || err?.message || `Error al procesar en motor IA (HTTP ${directResponse.status})`);
    } catch (err: any) {
      throw new Error(err.message || 'No se pudo conectar con el motor de Inteligencia Artificial (FastAPI).');
    }
  }

  async checkHealth(): Promise<{ status: string; model_loaded?: boolean }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/health`, { credentials: 'include' });
      if (response.ok) return await response.json();
    } catch {}

    try {
      const direct = await fetch(`${this.directFastApiUrl.replace('/api/v1', '')}/health`);
      if (direct.ok) return await direct.json();
    } catch {}

    return { status: 'error' };
  }
}
