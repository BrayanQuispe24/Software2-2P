<?php

namespace App\GraphQL\Mutations;

use App\Models\RutinaPersonalizada;

class GuardarRutinaPersonalizadaMutation
{
    public function __invoke($_, array $args): RutinaPersonalizada
    {
        $input = $args['input'];

        $payload = [
            'usuario_id' => $input['usuarioId'],
            'nombre' => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? null,
            'objetivo' => $input['objetivo'],
            'tipo_entrenamiento' => $input['tipoEntrenamiento'],
            'nivel' => $input['nivel'],
            'estado' => $input['estado'] ?? 'ACTIVO',
            'duracion_estimada_minutos' => $input['duracionEstimadaMinutos'] ?? 60,
            'bloques' => $input['bloques'],
            'metadatos_creacion' => [
                'origen' => 'GraphQL_MFE',
                'timestamp' => now()->toIso8601String(),
            ]
        ];

        if (!empty($input['id'])) {
            $rutina = RutinaPersonalizada::find($input['id']);
            if ($rutina) {
                $rutina->update($payload);
                return $rutina;
            }
        }

        return RutinaPersonalizada::create($payload);
    }
}

