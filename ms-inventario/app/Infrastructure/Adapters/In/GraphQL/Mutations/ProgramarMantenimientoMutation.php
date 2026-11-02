<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Mutations;

use App\Core\Application\Mantenimientos\UseCases\ProgramarMantenimientoUseCase;
use App\Core\Domain\Mantenimientos\Enums\TipoMantenimiento;
use App\Models\Mantenimiento as MantenimientoModel;

class ProgramarMantenimientoMutation
{
    public function __construct(
        private readonly ProgramarMantenimientoUseCase $useCase
    ) {}

    public function __invoke($_, array $args): MantenimientoModel
    {
        $input = $args['input'];

        $mantenimiento = $this->useCase->execute(
            equipoId: (string) $input['equipoId'],
            tipo: TipoMantenimiento::from((string) $input['tipo']),
            fechaInicio: (string) $input['fechaInicio'],
            descripcion: (string) $input['descripcion'],
            costoEstimado: isset($input['costoEstimado']) ? (float) $input['costoEstimado'] : 0.0,
            proximoMantenimiento: $input['proximoMantenimiento'] ?? null,
            observacion: $input['observacion'] ?? null
        );

        return MantenimientoModel::findOrFail($mantenimiento->getId());
    }
}
