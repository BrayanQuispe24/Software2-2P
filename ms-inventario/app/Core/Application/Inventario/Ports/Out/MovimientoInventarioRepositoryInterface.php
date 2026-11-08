<?php

declare(strict_types=1);

namespace App\Core\Application\Inventario\Ports\Out;

use App\Core\Domain\Inventario\Entities\MovimientoInventario;
use App\Core\Domain\Catalogos\Entities\TipoMovimiento;

interface MovimientoInventarioRepositoryInterface
{
    public function save(MovimientoInventario $movimiento): MovimientoInventario;
    /** @return MovimientoInventario[] */
    public function findByEquipoId(string $equipoId): array;
    public function findTipoMovimientoById(string $tipoMovimientoId): ?TipoMovimiento;
}
