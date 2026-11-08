<?php

declare(strict_types=1);

namespace App\Core\Application\Mantenimientos\Ports\Out;

use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use App\Core\Domain\Mantenimientos\Enums\EstadoMantenimiento;

interface MantenimientoRepositoryInterface
{
    public function findById(string $id): ?Mantenimiento;
    /** @return Mantenimiento[] */
    public function findByEquipoId(string $equipoId): array;
    /** @return Mantenimiento[] */
    public function findAlertasProximos(int $diasMargen = 7): array;
    public function tieneMantenimientosActivos(string $equipoId, ?string $excluirId = null): bool;
    public function save(Mantenimiento $mantenimiento): Mantenimiento;
}
