<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers;

use App\Core\Domain\Inventario\Entities\MovimientoInventario;
use App\Models\MovimientoInventario as MovimientoModel;
use DateTimeImmutable;

class MovimientoInventarioMapper
{
    public static function toDomain(MovimientoModel $model): MovimientoInventario
    {
        return new MovimientoInventario(
            id: (string) $model->id,
            fechaHora: new DateTimeImmutable($model->fecha_hora->format('Y-m-d H:i:s')),
            motivo: (string) $model->motivo,
            observacion: $model->observacion ? (string) $model->observacion : null,
            cantidad: (int) $model->cantidad,
            equipoId: (string) $model->id_equipo,
            tipoMovimientoId: (string) $model->id_tipo_movimiento,
            usuarioId: $model->id_usuario ? (string) $model->id_usuario : null,
            createdAt: $model->created_at ? new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')) : null
        );
    }

    public static function toEloquentArray(MovimientoInventario $entity): array
    {
        return [
            'fecha_hora' => $entity->getFechaHora()->format('Y-m-d H:i:s'),
            'motivo' => $entity->getMotivo(),
            'observacion' => $entity->getObservacion(),
            'cantidad' => $entity->getCantidad(),
            'id_equipo' => $entity->getEquipoId(),
            'id_tipo_movimiento' => $entity->getTipoMovimientoId(),
            'id_usuario' => $entity->getUsuarioId(),
        ];
    }
}
