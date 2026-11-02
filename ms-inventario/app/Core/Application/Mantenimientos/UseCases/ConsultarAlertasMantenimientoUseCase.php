<?php

declare(strict_types=1);

namespace App\Core\Application\Mantenimientos\UseCases;

use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;

class ConsultarAlertasMantenimientoUseCase
{
    public function __construct(
        private readonly MantenimientoRepositoryInterface $mantenimientoRepository
    ) {}

    /** @return \App\Core\Domain\Mantenimientos\Entities\Mantenimiento[] */
    public function execute(int $diasMargen = 7): array
    {
        return $this->mantenimientoRepository->findAlertasProximos($diasMargen);
    }
}
