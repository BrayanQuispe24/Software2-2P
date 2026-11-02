<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoMuscular extends Model
{
    use HasUuids;

    protected $table = 'grupo_muscular';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function ejercicioGruposMusculares(): HasMany
    {
        return $this->hasMany(EjercicioGrupoMuscular::class, 'id_grupo_muscular');
    }
}
