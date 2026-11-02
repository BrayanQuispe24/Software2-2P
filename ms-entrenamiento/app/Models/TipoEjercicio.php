<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoEjercicio extends Model
{
    use HasUuids;

    protected $table = 'tipo_ejercicio';

    protected $fillable = [
        'nombre',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function ejercicios(): HasMany
    {
        return $this->hasMany(Ejercicio::class, 'id_tipo_ejercicio');
    }
}
