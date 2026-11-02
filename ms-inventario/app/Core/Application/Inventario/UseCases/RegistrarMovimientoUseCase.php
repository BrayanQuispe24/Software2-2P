<?php

declare(strict_types=1);

namespace App\Core\Application\Inventario\UseCases;

use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Application\Inventario\Ports\Out\MovimientoInventarioRepositoryInterface;
use App\Core\Domain\Equipos\Exceptions\EquipoNoEncontradoException;
use App\Core\Domain\Inventario\Entities\MovimientoInventario;
use DateTimeImmutable;
use DomainException;
use Illuminate\Support\Facades\DB;

class RegistrarMovimientoUseCase
{
    public function __construct(
        private readonly EquipoRepositoryInterface $equipoRepository,
        private readonly MovimientoInventarioRepositoryInterface $movimientoRepository
    ) {}

    public function execute(
        string $equipoId,
        string $tipoMovimientoId,
        int $cantidad,
        string $motivo,
        ?string $observacion = null,
        ?string $usuarioId = null
    ): MovimientoInventario {
        return DB::transaction(function () use ($equipoId, $tipoMovimientoId, $cantidad, $motivo, $observacion, $usuarioId) {
            $equipo = $this->equipoRepository->findById($equipoId);
            if (!$equipo) {
                throw EquipoNoEncontradoException::porId($equipoId);
            }

            $tipoMovimiento = $this->movimientoRepository->findTipoMovimientoById($tipoMovimientoId);
            if (!$tipoMovimiento) {
                throw new DomainException("Tipo de movimiento no encontrado con ID: {$tipoMovimientoId}");
            }

            // Aplicar regla de negocio de inventario
            if ($tipoMovimiento->esSalida()) {
                $equipo->reducirStock($cantidad);
            } else {
                $equipo->aumentarStock($cantidad);
            }

            // Actualizar stock atómico del equipo
            $this->equipoRepository->updateCantidad($equipoId, $equipo->getCantidad());

            // Registrar movimiento en el Kardex
            $movimiento = new MovimientoInventario(
                id: null,
                fechaHora: new DateTimeImmutable(),
                motivo: $motivo,
                observacion: $observacion,
                cantidad: $cantidad,
                equipoId: $equipoId,
                tipoMovimientoId: $tipoMovimientoId,
                usuarioId: $usuarioId
            );

            return $this->movimientoRepository->save($movimiento);
        });
    }
}
