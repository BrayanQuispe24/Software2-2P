<?php

declare(strict_types=1);

namespace App\Core\Domain\Inventario\Exceptions;

use DomainException;

class StockInsuficienteException extends DomainException
{
    public static function paraCantidad(int $disponible, int $solicitada): self
    {
        return new self("Stock insuficiente. Disponible: {$disponible}, Solicitado: {$solicitada}");
    }
}
