<?php

namespace App\GraphQL\Queries;

use App\Models\Historial;

class HistorialPorUsuarioQuery
{
    public function __invoke($_, array $args): ?Historial
    {
        return Historial::with('detalles')
            ->where('id_usuario', $args['usuarioId'])
            ->first();
    }
}
