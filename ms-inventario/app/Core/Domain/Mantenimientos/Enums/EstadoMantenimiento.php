<?php

declare(strict_types=1);

namespace App\Core\Domain\Mantenimientos\Enums;

enum EstadoMantenimiento: string
{
    case PROGRAMADO = 'PROGRAMADO';
    case EN_PROCESO = 'EN_PROCESO';
    case COMPLETADO = 'COMPLETADO';
    case CANCELADO = 'CANCELADO';

    public function estaActivo(): bool
    {
        return in_array($this, [self::PROGRAMADO, self::EN_PROCESO], true);
    }
}
