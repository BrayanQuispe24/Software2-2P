<?php

declare(strict_types=1);

namespace App\Core\Domain\Mantenimientos\Entities;

use App\Core\Domain\Mantenimientos\Enums\EstadoMantenimiento;
use App\Core\Domain\Mantenimientos\Enums\TipoMantenimiento;
use App\Core\Domain\Mantenimientos\Exceptions\MantenimientoInvalidoException;
use DateTimeImmutable;

class Mantenimiento
{
    public function __construct(
        private readonly ?string $id,
        private TipoMantenimiento $tipo,
        private DateTimeImmutable $fechaInicio,
        private ?DateTimeImmutable $fechaFin,
        private string $descripcion,
        private float $costo,
        private EstadoMantenimiento $estado,
        private ?DateTimeImmutable $proximoMantenimiento,
        private ?string $observacion,
        private string $equipoId,
        private ?DateTimeImmutable $createdAt = null,
        private ?DateTimeImmutable $updatedAt = null,
    ) {}

    public function getId(): ?string { return $this->id; }
    public function getTipo(): TipoMantenimiento { return $this->tipo; }
    public function getFechaInicio(): DateTimeImmutable { return $this->fechaInicio; }
    public function getFechaFin(): ?DateTimeImmutable { return $this->fechaFin; }
    public function getDescripcion(): string { return $this->descripcion; }
    public function getCosto(): float { return $this->costo; }
    public function getEstado(): EstadoMantenimiento { return $this->estado; }
    public function getProximoMantenimiento(): ?DateTimeImmutable { return $this->proximoMantenimiento; }
    public function getObservacion(): ?string { return $this->observacion; }
    public function getEquipoId(): string { return $this->equipoId; }
    public function getCreatedAt(): ?DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?DateTimeImmutable { return $this->updatedAt; }

    // Invariantes del ciclo de mantenimiento
    public function iniciar(): void
    {
        if ($this->estado !== EstadoMantenimiento::PROGRAMADO) {
            throw MantenimientoInvalidoException::noSePuedeIniciar($this->estado->value);
        }
        $this->estado = EstadoMantenimiento::EN_PROCESO;
    }

    public function completar(float $costoFinal, ?string $observacion = null, ?DateTimeImmutable $fechaFin = null): void
    {
        if ($this->estado !== EstadoMantenimiento::EN_PROCESO) {
            throw MantenimientoInvalidoException::noSePuedeCompletar($this->estado->value);
        }
        $this->costo = $costoFinal;
        $this->estado = EstadoMantenimiento::COMPLETADO;
        $this->fechaFin = $fechaFin ?? new DateTimeImmutable();
        if ($observacion !== null) {
            $this->observacion = $observacion;
        }
    }

    public function cancelar(?string $motivo = null): void
    {
        $this->estado = EstadoMantenimiento::CANCELADO;
        if ($motivo !== null) {
            $this->observacion = ($this->observacion ? $this->observacion . ' | Motivo cancelación: ' : 'Motivo cancelación: ') . $motivo;
        }
    }
}
