<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetallePlanAlimentacion extends Model
{
    use HasUuids;

    protected $table = 'detalle_plan_alimentacion';

    protected $fillable = [
        'id_plan_alimentacion',
        'dia_semana',
        'tipo_comida',
        'alimento',
        'cantidad',
        'unidad',
        'hora',
        'calorias',
        'proteinas',
        'carbohidratos',
        'grasas',
        'observacion',
    ];

    protected $casts = [
        'cantidad' => 'float',
        'calorias' => 'float',
        'proteinas' => 'float',
        'carbohidratos' => 'float',
        'grasas' => 'float',
    ];

    public function planAlimentacion(): BelongsTo
    {
        return $this->belongsTo(PlanAlimentacion::class, 'id_plan_alimentacion');
    }
}
