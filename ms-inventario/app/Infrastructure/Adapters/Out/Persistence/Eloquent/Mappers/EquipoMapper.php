<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\Out\Persistence\Eloquent\Mappers;

use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Models\Equipo as EquipoModel;
use DateTimeImmutable;

class EquipoMapper
{
    public static function toDomain(EquipoModel $model): Equipo
    {
        return new Equipo(
            id: (string) $model->id,
            codigo: (string) $model->codigo,
            nombre: (string) $model->nombre,
            modelo: $model->modelo ? (string) $model->modelo : null,
            fechaAdquisicion: $model->fecha_adquisicion ? new DateTimeImmutable($model->fecha_adquisicion->format('Y-m-d')) : null,
            precioCompra: $model->precio_compra !== null ? (float) $model->precio_compra : null,
            estado: EstadoEquipo::from((string) $model->estado),
            cantidad: (int) $model->cantidad,
            ambienteId: (string) $model->id_ambiente,
            marcaId: (string) $model->id_marca,
            tipoEquipoId: (string) $model->id_tipo_equipo,
            createdAt: $model->created_at ? new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')) : null,
            updatedAt: $model->updated_at ? new DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s')) : null
        );
    }

    public static function toEloquentArray(Equipo $entity): array
    {
        return [
            'codigo' => $entity->getCodigo(),
            'nombre' => $entity->getNombre(),
            'modelo' => $entity->getModelo(),
            'fecha_adquisicion' => $entity->getFechaAdquisicion()?->format('Y-m-d'),
            'precio_compra' => $entity->getPrecioCompra(),
            'estado' => $entity->getEstado()->value,
            'cantidad' => $entity->getCantidad(),
            'id_ambiente' => $entity->getAmbienteId(),
            'id_marca' => $entity->getMarcaId(),
            'id_tipo_equipo' => $entity->getTipoEquipoId(),
        ];
    }
}
