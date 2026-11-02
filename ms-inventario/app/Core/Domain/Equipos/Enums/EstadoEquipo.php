<?php

declare(strict_types=1);

namespace App\Core\Domain\Equipos\Enums;

enum EstadoEquipo: string
{
    case OPERATIVO = 'OPERATIVO';
    case EN_MANTENIMIENTO = 'EN_MANTENIMIENTO';
    case DE_BAJA = 'DE_BAJA';
    case EN_REVISION = 'EN_REVISION';

    public function permiteOperacion(): bool
    {
        return $this === self::OPERATIVO;
    }
}
