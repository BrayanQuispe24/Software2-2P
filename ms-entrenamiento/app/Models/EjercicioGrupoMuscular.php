<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EjercicioGrupoMuscular extends Model
{
    use HasUuids;

    protected $table = 'ejercicio_grupo_muscular';

    protected $fillable = [
        'id_ejercicio',
        'id_grupo_muscular',
        'tipo_participacion',
        'observacion',
    ];

    public function ejercicio(): BelongsTo
    {
        return $this->belongsTo(Ejercicio::class, 'id_ejercicio');
    }

    public function grupoMuscular(): BelongsTo
    {
        return $this->belongsTo(GrupoMuscular::class, 'id_grupo_muscular');
    }
}
