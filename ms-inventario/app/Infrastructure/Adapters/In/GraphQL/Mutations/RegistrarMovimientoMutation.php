<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Mutations;

use App\Core\Application\Inventario\UseCases\RegistrarMovimientoUseCase;
use App\Models\MovimientoInventario as MovimientoModel;
use Illuminate\Http\Request;

class RegistrarMovimientoMutation
{
    public function __construct(
        private readonly RegistrarMovimientoUseCase $useCase,
        private readonly Request $request
    ) {}

    public function __invoke($_, array $args): MovimientoModel
    {
        $input = $args['input'];

        // Obtener usuario del header propagado por el API Gateway (Database-per-Service)
        $usuarioId = $this->request->header('x-user-id') ?? ($input['usuarioId'] ?? null);

        $movimiento = $this->useCase->execute(
            equipoId: (string) $input['equipoId'],
            tipoMovimientoId: (string) $input['tipoMovimientoId'],
            cantidad: (int) $input['cantidad'],
            motivo: (string) $input['motivo'],
            observacion: $input['observacion'] ?? null,
            usuarioId: $usuarioId ? (string) $usuarioId : null
        );

        return MovimientoModel::findOrFail($movimiento->getId());
    }
}
