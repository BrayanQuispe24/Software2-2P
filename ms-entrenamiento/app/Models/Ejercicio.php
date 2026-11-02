<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ejercicio extends Model
{
    use HasUuids;

    protected $table = 'ejercicios';

    protected $fillable = [
        'external_id',
        'nombre',
        'descripcion',
        'url_video',
        'imagenes',
        'equipamiento',
        'nivel_dificultad',
        'mecanica',
        'fuerza',
        'patron_movimiento',
        'id_tipo_ejercicio',
    ];

    protected $casts = [
        'imagenes' => 'array',
    ];

    public function tipoEjercicio(): BelongsTo
    {
        return $this->belongsTo(TipoEjercicio::class, 'id_tipo_ejercicio');
    }

    public function gruposMusculares(): HasMany
    {
        return $this->hasMany(EjercicioGrupoMuscular::class, 'id_ejercicio');
    }

    public function rutinaEjercicios(): HasMany
    {
        return $this->hasMany(RutinaEjercicio::class, 'id_ejercicio');
    }
}
