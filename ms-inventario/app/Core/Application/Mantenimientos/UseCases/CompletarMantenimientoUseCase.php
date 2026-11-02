<?php

declare(strict_types=1);

namespace App\Core\Application\Mantenimientos\UseCases;

use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;
use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use DomainException;

class CompletarMantenimientoUseCase
{
    public function __construct(
        private readonly MantenimientoRepositoryInterface $mantenimientoRepository,
        private readonly EquipoRepositoryInterface $equipoRepository
    ) {}

    public function execute(string $mantenimientoId, float $costoFinal, ?string $observacion = null): Mantenimiento
    {
        $mantenimiento = $this->mantenimientoRepository->findById($mantenimientoId);
        if (!$mantenimiento) {
            throw new DomainException("Mantenimiento no encontrado con ID: {$mantenimientoId}");
        }

        // Invariante de dominio: completar
        $mantenimiento->completar($costoFinal, $observacion);
        $guardado = $this->mantenimientoRepository->save($mantenimiento);

        // Si ya no quedan mantenimientos activos para este equipo, devolver a OPERATIVO
        $tieneOtrosActivos = $this->mantenimientoRepository->tieneMantenimientosActivos(
            $mantenimiento->getEquipoId(),
            $mantenimientoId
        );

        if (!$tieneOtrosActivos) {
            $this->equipoRepository->updateEstado($mantenimiento->getEquipoId(), EstadoEquipo::OPERATIVO);
        }

        return $guardado;
    }
}
