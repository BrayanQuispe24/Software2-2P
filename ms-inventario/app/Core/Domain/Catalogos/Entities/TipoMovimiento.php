<?php

declare(strict_types=1);

namespace App\Core\Domain\Catalogos\Entities;

class TipoMovimiento
{
    public function __construct(
        private readonly ?string $id,
        private string $nombre,
        private ?string $descripcion,
    ) {}

    public function getId(): ?string { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getDescripcion(): ?string { return $this->descripcion; }

    public function esSalida(): bool
    {
        return in_array(strtoupper($this->nombre), ['SALIDA', 'BAJA', 'TRASLADO'], true);
    }
}
