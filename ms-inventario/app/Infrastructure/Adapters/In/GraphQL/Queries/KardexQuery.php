<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Queries;

use App\Core\Application\Inventario\UseCases\ConsultarKardexUseCase;
use App\Models\MovimientoInventario as MovimientoModel;

class KardexQuery
{
    public function __construct(
        private readonly ConsultarKardexUseCase $useCase
    ) {}

    public function __invoke($_, array $args): iterable
    {
        $equipoId = (string) $args['equipoId'];
        $movimientos = $this->useCase->execute($equipoId);

        $ids = array_map(fn($m) => $m->getId(), $movimientos);
        return MovimientoModel::whereIn('id', $ids)->orderByDesc('fecha_hora')->get();
    }
}
