<?php

declare(strict_types=1);

namespace App\Core\Application\Inventario\UseCases;

use App\Core\Application\Inventario\Ports\Out\MovimientoInventarioRepositoryInterface;

class ConsultarKardexUseCase
{
    public function __construct(
        private readonly MovimientoInventarioRepositoryInterface $movimientoRepository
    ) {}

    /** @return \App\Core\Domain\Inventario\Entities\MovimientoInventario[] */
    public function execute(string $equipoId): array
    {
        return $this->movimientoRepository->findByEquipoId($equipoId);
    }
}
