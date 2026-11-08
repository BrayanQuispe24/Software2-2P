<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories;

use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;
use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use App\Core\Domain\Mantenimientos\Enums\EstadoMantenimiento;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers\MantenimientoMapper;
use App\Models\Mantenimiento as MantenimientoModel;
use Carbon\Carbon;

class EloquentMantenimientoRepository implements MantenimientoRepositoryInterface
{
    public function findById(string $id): ?Mantenimiento
    {
        $model = MantenimientoModel::find($id);
        return $model ? MantenimientoMapper::toDomain($model) : null;
    }

    public function findByEquipoId(string $equipoId): array
    {
        return MantenimientoModel::where('id_equipo', $equipoId)
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn(MantenimientoModel $m) => MantenimientoMapper::toDomain($m))
            ->all();
    }

    public function findAlertasProximos(int $diasMargen = 7): array
    {
        $hoy = Carbon::today();
        $limite = Carbon::today()->addDays($diasMargen);

        return MantenimientoModel::whereNotNull('proximo_mantenimiento')
            ->whereBetween('proximo_mantenimiento', [$hoy, $limite])
            ->whereIn('estado', [EstadoMantenimiento::PROGRAMADO->value, EstadoMantenimiento::COMPLETADO->value])
            ->orderBy('proximo_mantenimiento')
            ->get()
            ->map(fn(MantenimientoModel $m) => MantenimientoMapper::toDomain($m))
            ->all();
    }

    public function tieneMantenimientosActivos(string $equipoId, ?string $excluirId = null): bool
    {
        $query = MantenimientoModel::where('id_equipo', $equipoId)
            ->whereIn('estado', [
                EstadoMantenimiento::PROGRAMADO->value,
                EstadoMantenimiento::EN_PROCESO->value,
            ]);

        if ($excluirId !== null) {
            $query->where('id', '!=', $excluirId);
        }

        return $query->exists();
    }

    public function save(Mantenimiento $mantenimiento): Mantenimiento
    {
        $data = MantenimientoMapper::toEloquentArray($mantenimiento);
        if ($mantenimiento->getId() !== null) {
            $model = MantenimientoModel::findOrFail($mantenimiento->getId());
            $model->update($data);
        } else {
            $model = MantenimientoModel::create($data);
        }

        return MantenimientoMapper::toDomain($model);
    }
}
