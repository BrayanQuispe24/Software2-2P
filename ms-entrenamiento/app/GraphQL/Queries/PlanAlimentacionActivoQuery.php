<?php

namespace App\GraphQL\Queries;

use App\Models\PlanAlimentacion;

class PlanAlimentacionActivoQuery
{
    public function __invoke($_, array $args): ?PlanAlimentacion
    {
        return PlanAlimentacion::with('comidas')
            ->where('id_usuario', $args['usuarioId'])
            ->where('estado', true)
            ->latest('fecha_inicio')
            ->first();
    }
}
