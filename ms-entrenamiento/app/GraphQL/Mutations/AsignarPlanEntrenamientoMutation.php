<?php

namespace App\GraphQL\Mutations;

use App\Models\PlanEntrenamiento;
use App\Models\PlanEntrenamientoRutina;
use Illuminate\Support\Facades\DB;

class AsignarPlanEntrenamientoMutation
{
    public function __invoke($_, array $args): PlanEntrenamiento
    {
        $input = $args['input'];

        return DB::transaction(function () use ($input) {
            // Desactivar planes previos del usuario
            PlanEntrenamiento::where('id_usuario', $input['idUsuario'])
                ->update(['estado' => false]);

            $plan = PlanEntrenamiento::create([
                'id_usuario' => $input['idUsuario'],
                'nombre' => $input['nombre'],
                'objetivo' => $input['objetivo'],
                'fecha_inicio' => $input['fechaInicio'],
                'fecha_fin' => $input['fechaFin'],
                'observacion' => $input['observacion'] ?? null,
                'estado' => true,
            ]);

            foreach ($input['rutinas'] as $r) {
                PlanEntrenamientoRutina::create([
                    'id_plan_entrenamiento' => $plan->id,
                    'id_rutina' => $r['idRutina'],
                    'dia_semana' => $r['diaSemana'],
                ]);
            }

            return $plan->load('rutinasProgramadas.rutina.rutinaEjercicios.ejercicio');
        });
    }
}
