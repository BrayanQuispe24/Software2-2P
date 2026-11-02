<?php

namespace App\GraphQL\Queries;

use App\Models\PlanEntrenamiento;

class PlanEntrenamientoActivoQuery
{
    public function __invoke($_, array $args): ?PlanEntrenamiento
    {
        return PlanEntrenamiento::with(['rutinasProgramadas.rutina.rutinaEjercicios.ejercicio'])
            ->where('id_usuario', $args['usuarioId'])
            ->where('estado', true)
            ->latest('fecha_inicio')
            ->first();
    }
}
