<?php

namespace App\GraphQL\Mutations;

use App\Models\Historial;

class CrearHistorialMutation
{
    public function __invoke($_, array $args): Historial
    {
        $input = $args['input'];

        return Historial::firstOrCreate(
            ['id_usuario' => $input['idUsuario']],
            [
                'fecha_apertura' => now()->toDateString(),
                'grupo_sanguineo' => $input['grupoSanguineo'] ?? null,
                'sexo' => $input['sexo'] ?? null,
                'fecha_nacimiento' => $input['fechaNacimiento'] ?? null,
                'domicilio' => $input['domicilio'] ?? null,
                'facultad_carrera' => $input['facultadCarrera'] ?? null,
                'celular_emergencia' => $input['celularEmergencia'] ?? null,
                'observaciones_generales' => $input['observacionesGenerales'] ?? null,
            ]
        );
    }
}
