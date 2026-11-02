<?php

namespace App\GraphQL\Mutations;

use App\Models\DetallePlanAlimentacion;
use App\Models\PlanAlimentacion;
use Illuminate\Support\Facades\DB;

class AsignarPlanAlimentacionMutation
{
    public function __invoke($_, array $args): PlanAlimentacion
    {
        $input = $args['input'];

        return DB::transaction(function () use ($input) {
            // Desactivar planes de nutrición previos
            PlanAlimentacion::where('id_usuario', $input['idUsuario'])
                ->update(['estado' => false]);

            $plan = PlanAlimentacion::create([
                'id_usuario' => $input['idUsuario'],
                'nombre' => $input['nombre'],
                'objetivo' => $input['objetivo'],
                'fecha_inicio' => $input['fechaInicio'],
                'fecha_fin' => $input['fechaFin'],
                'observacion' => $input['observacion'] ?? null,
                'estado' => true,
            ]);

            foreach ($input['comidas'] as $c) {
                DetallePlanAlimentacion::create([
                    'id_plan_alimentacion' => $plan->id,
                    'dia_semana' => $c['diaSemana'],
                    'tipo_comida' => $c['tipoComida'],
                    'alimento' => $c['alimento'],
                    'cantidad' => $c['cantidad'],
                    'unidad' => $c['unidad'],
                    'hora' => $c['hora'] ?? null,
                    'calorias' => $c['calorias'] ?? 0,
                    'proteinas' => $c['proteinas'] ?? 0,
                    'carbohidratos' => $c['carbohidratos'] ?? 0,
                    'grasas' => $c['grasas'] ?? 0,
                    'observacion' => $c['observacion'] ?? null,
                ]);
            }

            return $plan->load('comidas');
        });
    }
}
