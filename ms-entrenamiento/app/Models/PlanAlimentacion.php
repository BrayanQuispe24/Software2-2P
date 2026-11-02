<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanAlimentacion extends Model
{
    use HasUuids;

    protected $table = 'plan_alimentacion';

    protected $fillable = [
        'id_usuario',
        'nombre',
        'objetivo',
        'fecha_inicio',
        'fecha_fin',
        'observacion',
        'estado',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'estado' => 'boolean',
    ];

    public function comidas(): HasMany
    {
        return $this->hasMany(DetallePlanAlimentacion::class, 'id_plan_alimentacion');
    }
}
