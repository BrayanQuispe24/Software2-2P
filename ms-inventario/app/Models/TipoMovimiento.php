<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoMovimiento extends Model
{
    use HasUuids;

    protected $table = 'tipo_movimiento';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class, 'id_tipo_movimiento');
    }
}
