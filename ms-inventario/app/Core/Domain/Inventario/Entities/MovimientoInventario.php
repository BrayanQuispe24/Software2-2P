<?php

declare(strict_types=1);

namespace App\Core\Domain\Inventario\Entities;

use DateTimeImmutable;

class MovimientoInventario
{
    public function __construct(
        private readonly ?string $id,
        private DateTimeImmutable $fechaHora,
        private string $motivo,
        private ?string $observacion,
        private int $cantidad,
        private string $equipoId,
        private string $tipoMovimientoId,
        private ?string $usuarioId = null,
        private ?DateTimeImmutable $createdAt = null,
    ) {
        if ($this->cantidad <= 0) {
            throw new \InvalidArgumentException('La cantidad del movimiento debe ser estrictamente mayor a 0.');
        }
    }

    public function getId(): ?string { return $this->id; }
    public function getFechaHora(): DateTimeImmutable { return $this->fechaHora; }
    public function getMotivo(): string { return $this->motivo; }
    public function getObservacion(): ?string { return $this->observacion; }
    public function getCantidad(): int { return $this->cantidad; }
    public function getEquipoId(): string { return $this->equipoId; }
    public function getTipoMovimientoId(): string { return $this->tipoMovimientoId; }
    public function getUsuarioId(): ?string { return $this->usuarioId; }
    public function getCreatedAt(): ?DateTimeImmutable { return $this->createdAt; }
}
