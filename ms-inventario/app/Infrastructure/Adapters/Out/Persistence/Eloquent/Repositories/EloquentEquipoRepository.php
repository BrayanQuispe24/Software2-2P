<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories;

use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers\EquipoMapper;
use App\Models\Equipo as EquipoModel;

class EloquentEquipoRepository implements EquipoRepositoryInterface
{
    public function findById(string $id): ?Equipo
    {
        $model = EquipoModel::find($id);
        return $model ? EquipoMapper::toDomain($model) : null;
    }

    public function findByCodigo(string $codigo): ?Equipo
    {
        $model = EquipoModel::where('codigo', $codigo)->first();
        return $model ? EquipoMapper::toDomain($model) : null;
    }

    public function findAll(?EstadoEquipo $estado = null, ?string $ambienteId = null, ?string $marcaId = null): array
    {
        $query = EquipoModel::query();
        if ($estado !== null) {
            $query->where('estado', $estado->value);
        }
        if ($ambienteId !== null) {
            $query->where('id_ambiente', $ambienteId);
        }
        if ($marcaId !== null) {
            $query->where('id_marca', $marcaId);
        }

        return $query->get()->map(fn(EquipoModel $m) => EquipoMapper::toDomain($m))->all();
    }

    public function save(Equipo $equipo): Equipo
    {
        $data = EquipoMapper::toEloquentArray($equipo);
        if ($equipo->getId() !== null) {
            $model = EquipoModel::findOrFail($equipo->getId());
            $model->update($data);
        } else {
            $model = EquipoModel::create($data);
        }

        return EquipoMapper::toDomain($model);
    }

    public function updateCantidad(string $equipoId, int $nuevaCantidad): void
    {
        EquipoModel::where('id', $equipoId)->update(['cantidad' => $nuevaCantidad]);
    }

    public function updateEstado(string $equipoId, EstadoEquipo $nuevoEstado): void
    {
        EquipoModel::where('id', $equipoId)->update(['estado' => $nuevoEstado->value]);
    }
}
