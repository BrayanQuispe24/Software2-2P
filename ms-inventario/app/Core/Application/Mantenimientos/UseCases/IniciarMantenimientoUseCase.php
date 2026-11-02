<?php

declare(strict_types=1);

namespace App\Core\Application\Mantenimientos\UseCases;

use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;
use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use DomainException;

class IniciarMantenimientoUseCase
{
    public function __construct(
        private readonly MantenimientoRepositoryInterface $mantenimientoRepository,
        private readonly EquipoRepositoryInterface $equipoRepository
    ) {}

    public function execute(string $mantenimientoId): Mantenimiento
    {
        $mantenimiento = $this->mantenimientoRepository->findById($mantenimientoId);
        if (!$mantenimiento) {
            throw new DomainException("Mantenimiento no encontrado con ID: {$mantenimientoId}");
        }

        // Invariante de dominio: iniciar transición
        $mantenimiento->iniciar();
        $guardado = $this->mantenimientoRepository->save($mantenimiento);

        // Conmutar el equipo a EN_MANTENIMIENTO
        $this->equipoRepository->updateEstado($mantenimiento->getEquipoId(), EstadoEquipo::EN_MANTENIMIENTO);

        return $guardado;
    }
}
