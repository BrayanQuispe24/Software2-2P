<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Mutations;

use App\Core\Application\Equipos\UseCases\ActualizarEstadoEquipoUseCase;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Models\Equipo as EquipoModel;

class ActualizarEstadoEquipoMutation
{
    public function __construct(
        private readonly ActualizarEstadoEquipoUseCase $useCase
    ) {}

    public function __invoke($_, array $args): EquipoModel
    {
        $id = (string) $args['id'];
        $nuevoEstado = EstadoEquipo::from((string) $args['nuevoEstado']);

        $equipo = $this->useCase->execute($id, $nuevoEstado);

        return EquipoModel::findOrFail($equipo->getId());
    }
}
