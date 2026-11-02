<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipo extends Model
{
    use HasUuids;

    protected $table = 'equipos';

    protected $fillable = [
        'codigo',
        'nombre',
        'modelo',
        'fecha_adquisicion',
        'precio_compra',
        'estado',
        'cantidad',
        'id_ambiente',
        'id_marca',
        'id_tipo_equipo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_adquisicion' => 'date',
            'precio_compra' => 'decimal:2',
            'cantidad' => 'integer',
        ];
    }

    public function ambiente(): BelongsTo
    {
        return $this->belongsTo(Ambiente::class, 'id_ambiente');
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'id_marca');
    }

    public function tipoEquipo(): BelongsTo
    {
        return $this->belongsTo(TipoEquipo::class, 'id_tipo_equipo');
    }

    public function mantenimientos(): HasMany
    {
        return $this->hasMany(Mantenimiento::class, 'id_equipo');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class, 'id_equipo');
    }
}
