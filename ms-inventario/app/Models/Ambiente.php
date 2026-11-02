<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ambiente extends Model
{
    use HasUuids;

    protected $table = 'ambientes';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
    ];

    public function equipos(): HasMany
    {
        return $this->hasMany(Equipo::class, 'id_ambiente');
    }
}
