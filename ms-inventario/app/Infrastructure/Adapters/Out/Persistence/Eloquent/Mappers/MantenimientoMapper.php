<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers;

use App\Core\Domain\Mantenimientos\Entities\Mantenimiento;
use App\Core\Domain\Mantenimientos\Enums\EstadoMantenimiento;
use App\Core\Domain\Mantenimientos\Enums\TipoMantenimiento;
use App\Models\Mantenimiento as MantenimientoModel;
use DateTimeImmutable;

class MantenimientoMapper
{
    public static function toDomain(MantenimientoModel $model): Mantenimiento
    {
        return new Mantenimiento(
            id: (string) $model->id,
            tipo: TipoMantenimiento::from((string) $model->tipo),
            fechaInicio: new DateTimeImmutable($model->fecha_inicio->format('Y-m-d H:i:s')),
            fechaFin: $model->fecha_fin ? new DateTimeImmutable($model->fecha_fin->format('Y-m-d H:i:s')) : null,
            descripcion: (string) $model->descripcion,
            costo: (float) $model->costo,
            estado: EstadoMantenimiento::from((string) $model->estado),
            proximoMantenimiento: $model->proximo_mantenimiento ? new DateTimeImmutable($model->proximo_mantenimiento->format('Y-m-d')) : null,
            observacion: $model->observacion ? (string) $model->observacion : null,
            equipoId: (string) $model->id_equipo,
            createdAt: $model->created_at ? new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')) : null,
            updatedAt: $model->updated_at ? new DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s')) : null
        );
    }

    public static function toEloquentArray(Mantenimiento $entity): array
    {
        return [
            'tipo' => $entity->getTipo()->value,
            'fecha_inicio' => $entity->getFechaInicio()->format('Y-m-d H:i:s'),
            'fecha_fin' => $entity->getFechaFin()?->format('Y-m-d H:i:s'),
            'descripcion' => $entity->getDescripcion(),
            'costo' => $entity->getCosto(),
            'estado' => $entity->getEstado()->value,
            'proximo_mantenimiento' => $entity->getProximoMantenimiento()?->format('Y-m-d'),
            'observacion' => $entity->getObservacion(),
            'id_equipo' => $entity->getEquipoId(),
        ];
    }
}
