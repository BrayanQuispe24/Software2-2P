<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories;

use App\Core\Application\Catalogos\Ports\Out\CatalogoRepositoryInterface;
use App\Core\Domain\Catalogos\Entities\Ambiente;
use App\Core\Domain\Catalogos\Entities\Marca;
use App\Core\Domain\Catalogos\Entities\TipoEquipo;
use App\Core\Domain\Catalogos\Entities\TipoMovimiento;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers\CatalogoMapper;
use App\Models\Ambiente as AmbienteModel;
use App\Models\Marca as MarcaModel;
use App\Models\TipoEquipo as TipoEquipoModel;
use App\Models\TipoMovimiento as TipoMovimientoModel;

class EloquentCatalogoRepository implements CatalogoRepositoryInterface
{
    public function saveAmbiente(Ambiente $ambiente): Ambiente
    {
        $model = AmbienteModel::create([
            'nombre' => $ambiente->getNombre(),
            'descripcion' => $ambiente->getDescripcion(),
            'estado' => $ambiente->getEstado(),
        ]);
        return CatalogoMapper::ambienteToDomain($model);
    }

    public function saveMarca(Marca $marca): Marca
    {
        $model = MarcaModel::create([
            'nombre' => $marca->getNombre(),
            'estado' => $marca->getEstado(),
        ]);
        return CatalogoMapper::marcaToDomain($model);
    }

    public function saveTipoEquipo(TipoEquipo $tipo): TipoEquipo
    {
        $model = TipoEquipoModel::create([
            'nombre' => $tipo->getNombre(),
            'descripcion' => $tipo->getDescripcion(),
            'estado' => $tipo->getEstado(),
        ]);
        return CatalogoMapper::tipoEquipoToDomain($model);
    }

    public function saveTipoMovimiento(TipoMovimiento $tipo): TipoMovimiento
    {
        $model = TipoMovimientoModel::create([
            'nombre' => $tipo->getNombre(),
            'descripcion' => $tipo->getDescripcion(),
        ]);
        return CatalogoMapper::tipoMovimientoToDomain($model);
    }
}
