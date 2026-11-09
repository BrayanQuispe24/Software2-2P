<?php

namespace App\GraphQL\Queries;

use App\Models\RutinaPersonalizada;

class RutinaPersonalizadaPorIdQuery
{
    public function __invoke($_, array $args): ?RutinaPersonalizada
    {
        return RutinaPersonalizada::find($args['id']);
    }
}

