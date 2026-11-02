<?php

declare(strict_types=1);

namespace App\Core\Domain\Mantenimientos\Exceptions;

use DomainException;

class MantenimientoInvalidoException extends DomainException
{
    public static function noSePuedeIniciar(string $estadoActual): self
    {
        return new self("No se puede iniciar el mantenimiento porque está en estado: {$estadoActual}");
    }

    public static function noSePuedeCompletar(string $estadoActual): self
    {
        return new self("Solo mantenimientos EN_PROCESO pueden completarse. Estado actual: {$estadoActual}");
    }
}
