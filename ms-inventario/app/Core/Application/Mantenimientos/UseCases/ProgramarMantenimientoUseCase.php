<?php

declare(strict_types=1);

namespace App\Core\Application\Mantenimientos\UseCases;

use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;
use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Exceptions\EquipoNoEncontradoException;
use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use App\Core\Domain\Mantenimientos\Enums\EstadoMantenimiento;
use App\Core\Domain\Mantenimientos\Enums\TipoMantenimiento;
use DateTimeImmutable;

class ProgramarMantenimientoUseCase
{
    public function __construct(
        private readonly MantenimientoRepositoryInterface $mantenimientoRepository,
        private readonly EquipoRepositoryInterface $equipoRepository
    ) {}

    public function execute(
        string $equipoId,
        TipoMantenimiento $tipo,
        string $fechaInicio,
        string $descripcion,
        float $costoEstimado = 0.0,
        ?string $proximoMantenimiento = null,
        ?string $observacion = null
    ): Mantenimiento {
        $equipo = $this->equipoRepository->findById($equipoId);
        if (!$equipo) {
            throw EquipoNoEncontradoException::porId($equipoId);
        }

        $inicio = new DateTimeImmutable($fechaInicio);
        $proximo = $proximoMantenimiento ? new DateTimeImmutable($proximoMantenimiento) : null;

        $mantenimiento = new Mantenimiento(
            id: null,
            tipo: $tipo,
            fechaInicio: $inicio,
            fechaFin: null,
            descripcion: $descripcion,
            costo: $costoEstimado,
            estado: EstadoMantenimiento::PROGRAMADO,
            proximoMantenimiento: $proximo,
            observacion: $observacion,
            equipoId: $equipoId
        );

        return $this->mantenimientoRepository->save($mantenimiento);
    }
}
