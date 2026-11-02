<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Marca extends Model
{
    use HasUuids;

    protected $table = 'marcas';

    protected $fillable = [
        'nombre',
        'estado',
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'id_marca');
    }
}
