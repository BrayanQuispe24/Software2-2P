<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class RutinaPersonalizada extends Model
{
    /**
     * Conexión designada de base de datos NoSQL (MongoDB).
     */
    protected $connection = 'mongodb';

    /**
     * Colección BSON donde se persisten las rutinas personalizadas.
     */
    protected $collection = 'rutinas_personalizadas';

    /**
     * Atributos asignables en masa.
     */
    protected $fillable = [
        'usuario_id',
        'nombre',
        'descripcion',
        'objetivo',
        'tipo_entrenamiento',
        'nivel',
        'estado',
        'duracion_estimada_minutos',
        'configuracion',
        'bloques',
        'metadatos_creacion',
    ];

    /**
     * Casteo nativo de atributos BSON a tipos PHP / Array.
     */
    protected $casts = [
        'configuracion' => 'array',
        'bloques' => 'array',
        'metadatos_creacion' => 'array',
        'duracion_estimada_minutos' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope para filtrar por usuario específico.
     */
    public function scopePorUsuario($query, string $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }

    /**
     * Scope para filtrar rutinas activas.
     */
    public function scopeActivas($query)
    {
        return $query->where('estado', 'ACTIVO');
    }
}

