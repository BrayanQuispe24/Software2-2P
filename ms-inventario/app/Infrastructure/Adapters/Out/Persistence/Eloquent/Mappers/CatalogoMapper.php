<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers;

use App\Core\Domain\Catalogos\Entities\Ambiente;
use App\Core\Domain\Catalogos\Entities\Marca;
use App\Core\Domain\Catalogos\Entities\TipoEquipo;
use App\Core\Domain\Catalogos\Entities\TipoMovimiento;
use App\Models\Ambiente as AmbienteModel;
use App\Models\Marca as MarcaModel;
use App\Models\TipoEquipo as TipoEquipoModel;
use App\Models\TipoMovimiento as TipoMovimientoModel;

class CatalogoMapper
{
    public static function ambienteToDomain(AmbienteModel $model): Ambiente
    {
        return new Ambiente(
            id: (string) $model->id,
            nombre: (string) $model->nombre,
            descripcion: $model->descripcion ? (string) $model->descripcion : null,
            estado: (string) $model->estado
        );
    }

    public static function marcaToDomain(MarcaModel $model): Marca
    {
        return new Marca(
            id: (string) $model->id,
            nombre: (string) $model->nombre,
            estado: (string) $model->estado
        );
    }

    public static function tipoEquipoToDomain(TipoEquipoModel $model): TipoEquipo
    {
        return new TipoEquipo(
            id: (string) $model->id,
            nombre: (string) $model->nombre,
            descripcion: $model->descripcion ? (string) $model->descripcion : null,
            estado: (string) $model->estado
        );
    }

    public static function tipoMovimientoToDomain(TipoMovimientoModel $model): TipoMovimiento
    {
        return new TipoMovimiento(
            id: (string) $model->id,
            nombre: (string) $model->nombre,
            descripcion: $model->descripcion ? (string) $model->descripcion : null
        );
    }
}
