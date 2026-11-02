<?php

declare(strict_types=1);

namespace App\Core\Domain\Catalogos\Entities;

class Marca
{
    public function __construct(
        private readonly ?string $id,
        private string $nombre,
        private string $estado = 'ACTIVO',
    ) {}

    public function getId(): ?string { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getEstado(): string { return $this->estado; }
}
