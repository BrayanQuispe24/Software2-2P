<?php

declare(strict_types=1);

namespace App\Core\Application\Equipos\UseCases;

use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use DateTimeImmutable;

class CrearEquipoUseCase
{
    public function __construct(
        private readonly EquipoRepositoryInterface $equipoRepository
    ) {}

    public function execute(
        string $codigo,
        string $nombre,
        ?string $modelo,
        ?string $fechaAdquisicion,
        ?float $precioCompra,
        int $cantidadInicial,
        string $ambienteId,
        string $marcaId,
        string $tipoEquipoId
    ): Equipo {
        $fecha = $fechaAdquisicion ? new DateTimeImmutable($fechaAdquisicion) : null;

        $equipo = new Equipo(
            id: null,
            codigo: $codigo,
            nombre: $nombre,
            modelo: $modelo,
            fechaAdquisicion: $fecha,
            precioCompra: $precioCompra,
            estado: EstadoEquipo::OPERATIVO,
            cantidad: $cantidadInicial,
            ambienteId: $ambienteId,
            marcaId: $marcaId,
            tipoEquipoId: $tipoEquipoId
        );

        return $this->equipoRepository->save($equipo);
    }
}
