<?php

declare(strict_types=1);

namespace App\Core\Domain\Mantenimientos\Enums;

enum TipoMantenimiento: string
{
    case PREVENTIVO = 'PREVENTIVO';
    case CORRECTIVO = 'CORRECTIVO';
}
