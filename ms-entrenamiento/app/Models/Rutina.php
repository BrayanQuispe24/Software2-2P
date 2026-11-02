<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rutina extends Model
{
    use HasUuids;

    protected $table = 'rutinas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'nivel',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function rutinaEjercicios(): HasMany
    {
        return $this->hasMany(RutinaEjercicio::class, 'id_rutina')->orderBy('orden');
    }

    public function planEntrenamientoRutinas(): HasMany
    {
        return $this->hasMany(PlanEntrenamientoRutina::class, 'id_rutina');
    }
}
