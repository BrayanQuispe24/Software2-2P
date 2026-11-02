<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Mutations;

use App\Core\Application\Mantenimientos\UseCases\CompletarMantenimientoUseCase;
use App\Models\Mantenimiento as MantenimientoModel;

class CompletarMantenimientoMutation
{
    public function __construct(
        private readonly CompletarMantenimientoUseCase $useCase
    ) {}

    public function __invoke($_, array $args): MantenimientoModel
    {
        $id = (string) $args['id'];
        $costoFinal = (float) $args['costoFinal'];
        $observacion = $args['observacion'] ?? null;

        $mantenimiento = $this->useCase->execute($id, $costoFinal, $observacion);

        return MantenimientoModel::findOrFail($mantenimiento->getId());
    }
}
