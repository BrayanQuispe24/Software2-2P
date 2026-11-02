<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Queries;

use App\Core\Application\Mantenimientos\UseCases\ConsultarAlertasMantenimientoUseCase;
use App\Models\Mantenimiento as MantenimientoModel;

class AlertasMantenimientoQuery
{
    public function __construct(
        private readonly ConsultarAlertasMantenimientoUseCase $useCase
    ) {}

    public function __invoke($_, array $args): iterable
    {
        $diasMargen = (int) ($args['diasMargen'] ?? 7);
        $alertas = $this->useCase->execute($diasMargen);

        $ids = array_map(fn($a) => $a->getId(), $alertas);
        return MantenimientoModel::whereIn('id', $ids)->get();
    }
}
