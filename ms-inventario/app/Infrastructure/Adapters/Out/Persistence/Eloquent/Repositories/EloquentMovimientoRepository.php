<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories;

use App\Core\Application\Inventario\Ports\Out\MovimientoInventarioRepositoryInterface;
use App\Core\Domain\Catalogos\Entities\TipoMovimiento;
use App\Core\Domain\Inventario\Entities\MovimientoInventario;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers\CatalogoMapper;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers\MovimientoInventarioMapper;
use App\Models\MovimientoInventario as MovimientoModel;
use App\Models\TipoMovimiento as TipoMovimientoModel;

class EloquentMovimientoRepository implements MovimientoInventarioRepositoryInterface
{
    public function save(MovimientoInventario $movimiento): MovimientoInventario
    {
        $data = MovimientoInventarioMapper::toEloquentArray($movimiento);
        $model = MovimientoModel::create($data);

        return MovimientoInventarioMapper::toDomain($model);
    }

    public function findByEquipoId(string $equipoId): array
    {
        return MovimientoModel::where('id_equipo', $equipoId)
            ->orderByDesc('fecha_hora')
            ->get()
            ->map(fn(MovimientoModel $m) => MovimientoInventarioMapper::toDomain($m))
            ->all();
    }

    public function findTipoMovimientoById(string $tipoMovimientoId): ?TipoMovimiento
    {
        $model = TipoMovimientoModel::find($tipoMovimientoId);
        return $model ? CatalogoMapper::tipoMovimientoToDomain($model) : null;
    }
}
