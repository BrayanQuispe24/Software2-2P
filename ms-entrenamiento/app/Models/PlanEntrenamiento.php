<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanEntrenamiento extends Model
{
    use HasUuids;

    protected $table = 'plan_entrenamientos';

    protected $fillable = [
        'id_usuario',
        'nombre',
        'objetivo',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'observacion',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'estado' => 'boolean',
    ];

    public function rutinasProgramadas(): HasMany
    {
        return $this->hasMany(PlanEntrenamientoRutina::class, 'id_plan_entrenamiento');
    }
}
