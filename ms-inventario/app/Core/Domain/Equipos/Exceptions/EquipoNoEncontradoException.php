<?php

declare(strict_types=1);

namespace App\Core\Domain\Equipos\Exceptions;

use DomainException;

class EquipoNoEncontradoException extends DomainException
{
    public static function porId(string $id): self
    {
        return new self("No se encontró el equipo con ID: {$id}");
    }

    public static function porCodigo(string $codigo): self
    {
        return new self("No se encontró el equipo con código: {$codigo}");
    }
}
