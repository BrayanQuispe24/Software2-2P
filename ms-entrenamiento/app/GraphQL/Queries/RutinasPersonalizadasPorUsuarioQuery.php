<?php

namespace App\GraphQL\Queries;

use App\Models\RutinaPersonalizada;

class RutinasPersonalizadasPorUsuarioQuery
{
    public function __invoke($_, array $args)
    {
        return RutinaPersonalizada::where('usuario_id', $args['usuarioId'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

