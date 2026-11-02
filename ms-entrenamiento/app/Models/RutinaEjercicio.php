<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RutinaEjercicio extends Model
{
    use HasUuids;

    protected $table = 'rutina_ejercicio';

    protected $fillable = [
        'id_rutina',
        'id_ejercicio',
        'series',
        'repeticiones',
        'peso',
        'duracion_segundos',
        'descanso_segundos',
        'orden',
        'observacion',
    ];

    protected $casts = [
        'series' => 'integer',
        'repeticiones' => 'integer',
        'peso' => 'float',
        'duracion_segundos' => 'integer',
        'descanso_segundos' => 'integer',
        'orden' => 'integer',
    ];

    public function rutina(): BelongsTo
    {
        return $this->belongsTo(Rutina::class, 'id_rutina');
    }

    public function ejercicio(): BelongsTo
    {
        return $this->belongsTo(Ejercicio::class, 'id_ejercicio');
    }
}
