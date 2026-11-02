<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleHistorial extends Model
{
    use HasUuids;

    protected $table = 'detalle_historial';

    protected $fillable = [
        'id_historial',
        'peso',
        'altura',
        'imc',
        'porcentaje_grasa',
        'masa_muscular',
        'presion',
        'fecha_registro',
    ];

    protected $casts = [
        'peso' => 'float',
        'altura' => 'float',
        'imc' => 'float',
        'porcentaje_grasa' => 'float',
        'masa_muscular' => 'float',
        'fecha_registro' => 'datetime',
    ];

    public function historial(): BelongsTo
    {
        return $this->belongsTo(Historial::class, 'id_historial');
    }
}
