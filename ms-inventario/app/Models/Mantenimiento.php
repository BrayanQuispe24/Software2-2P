<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mantenimiento extends Model
{
    use HasUuids;

    protected $table = 'mantenimientos';

    protected $fillable = [
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'descripcion',
        'costo',
        'estado',
        'proximo_mantenimiento',
        'observacion',
        'id_equipo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin' => 'datetime',
            'proximo_mantenimiento' => 'date',
            'costo' => 'decimal:2',
        ];
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'id_equipo');
    }
}
