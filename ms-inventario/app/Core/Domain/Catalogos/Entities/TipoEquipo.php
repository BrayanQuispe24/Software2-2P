<?php

declare(strict_types=1);

namespace App\Core\Domain\Catalogos\Entities;

class TipoEquipo
{
    public function __construct(
        private readonly ?string $id,
        private string $nombre,
        private ?string $descripcion,
        private string $estado = 'ACTIVO',
    ) {}

    public function getId(): ?string { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getDescripcion(): ?string { return $this->descripcion; }
    public function getEstado(): string { return $this->estado; }
}
