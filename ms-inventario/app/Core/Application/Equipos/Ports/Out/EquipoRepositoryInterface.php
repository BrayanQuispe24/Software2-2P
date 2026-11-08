<?php

declare(strict_types=1);

namespace App\Core\Application\Equipos\Ports\Out;

use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;

interface EquipoRepositoryInterface
{
    public function findById(string $id): ?Equipo;
    public function findByCodigo(string $codigo): ?Equipo;
    /** @return Equipo[] */
    public function findAll(?EstadoEquipo $estado = null, ?string $ambienteId = null, ?string $marcaId = null): array;
    public function save(Equipo $equipo): Equipo;
    public function updateCantidad(string $equipoId, int $nuevaCantidad): void;
    public function updateEstado(string $equipoId, EstadoEquipo $nuevoEstado): void;
}
