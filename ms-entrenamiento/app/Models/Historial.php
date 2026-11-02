<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Historial extends Model
{
    use HasUuids;

    protected $table = 'historiales';

    protected $fillable = [
        'id_usuario',
        'fecha_apertura',
        'observaciones_generales',
        'grupo_sanguineo',
        'sexo',
        'fecha_nacimiento',
        'domicilio',
        'facultad_carrera',
        'celular_emergencia',
    ];

    protected $casts = [
        'fecha_apertura' => 'date',
        'fecha_nacimiento' => 'date',
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleHistorial::class, 'id_historial')->orderBy('fecha_registro', 'desc');
    }
}
