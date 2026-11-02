<?php

declare(strict_types=1);

namespace App\Core\Application\Equipos\UseCases;

use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Core\Domain\Equipos\Exceptions\EquipoNoEncontradoException;

class ActualizarEstadoEquipoUseCase
{
    public function __construct(
        private readonly EquipoRepositoryInterface $equipoRepository
    ) {}

    public function execute(string $equipoId, EstadoEquipo $nuevoEstado): Equipo
    {
        $equipo = $this->equipoRepository->findById($equipoId);
        if (!$equipo) {
            throw EquipoNoEncontradoException::porId($equipoId);
        }

        $equipo->cambiarEstado($nuevoEstado);
        $this->equipoRepository->updateEstado($equipoId, $nuevoEstado);

        return $equipo;
    }
}
