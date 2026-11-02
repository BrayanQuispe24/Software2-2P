<?php

declare(strict_types=1);

namespace App\Core\Domain\Equipos\Entities;

use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Core\Domain\Inventario\Exceptions\StockInsuficienteException;
use DateTimeImmutable;

class Equipo
{
    public function __construct(
        private readonly ?string $id,
        private string $codigo,
        private string $nombre,
        private ?string $modelo,
        private ?DateTimeImmutable $fechaAdquisicion,
        private ?float $precioCompra,
        private EstadoEquipo $estado,
        private int $cantidad,
        private string $ambienteId,
        private string $marcaId,
        private string $tipoEquipoId,
        private ?DateTimeImmutable $createdAt = null,
        private ?DateTimeImmutable $updatedAt = null,
    ) {
        if ($this->cantidad < 0) {
            throw new \InvalidArgumentException('La cantidad no puede ser negativa.');
        }
    }

    public function getId(): ?string { return $this->id; }
    public function getCodigo(): string { return $this->codigo; }
    public function getNombre(): string { return $this->nombre; }
    public function getModelo(): ?string { return $this->modelo; }
    public function getFechaAdquisicion(): ?DateTimeImmutable { return $this->fechaAdquisicion; }
    public function getPrecioCompra(): ?float { return $this->precioCompra; }
    public function getEstado(): EstadoEquipo { return $this->estado; }
    public function getCantidad(): int { return $this->cantidad; }
    public function getAmbienteId(): string { return $this->ambienteId; }
    public function getMarcaId(): string { return $this->marcaId; }
    public function getTipoEquipoId(): string { return $this->tipoEquipoId; }
    public function getCreatedAt(): ?DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?DateTimeImmutable { return $this->updatedAt; }

    // Reglas de negocio e invariantes del Dominio
    public function reducirStock(int $cantidadAReducir): void
    {
        if ($cantidadAReducir <= 0) {
            throw new \InvalidArgumentException('La cantidad a reducir debe ser mayor a cero.');
        }
        if ($this->cantidad < $cantidadAReducir) {
            throw StockInsuficienteException::paraCantidad($this->cantidad, $cantidadAReducir);
        }
        $this->cantidad -= $cantidadAReducir;
    }

    public function aumentarStock(int $cantidadAAumentar): void
    {
        if ($cantidadAAumentar <= 0) {
            throw new \InvalidArgumentException('La cantidad a aumentar debe ser mayor a cero.');
        }
        $this->cantidad += $cantidadAAumentar;
    }

    public function cambiarEstado(EstadoEquipo $nuevoEstado): void
    {
        $this->estado = $nuevoEstado;
    }

    public function entrarEnMantenimiento(): void
    {
        $this->estado = EstadoEquipo::EN_MANTENIMIENTO;
    }

    public function retornarAOperativo(): void
    {
        $this->estado = EstadoEquipo::OPERATIVO;
    }
}
