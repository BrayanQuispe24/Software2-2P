<?php

namespace App\GraphQL\Mutations;

use App\Models\RutinaPersonalizada;

class EliminarRutinaPersonalizadaMutation
{
    public function __invoke($_, array $args): bool
    {
        $rutina = RutinaPersonalizada::find($args['id']);
        if ($rutina) {
            return (bool)$rutina->delete();
        }

        return false;
    }
}

