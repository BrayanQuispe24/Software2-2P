<?php

namespace App\GraphQL\Mutations;

use App\Models\Rutina;
use App\Models\RutinaEjercicio;
use Illuminate\Support\Facades\DB;

class CrearRutinaMutation
{
    public function __invoke($_, array $args): Rutina
    {
        $input = $args['input'];

        return DB::transaction(function () use ($input) {
            $rutina = Rutina::create([
                'nombre' => $input['nombre'],
                'descripcion' => $input['descripcion'] ?? null,
                'nivel' => $input['nivel'],
                'estado' => true,
            ]);

            foreach ($input['ejercicios'] as $item) {
                RutinaEjercicio::create([
                    'id_rutina' => $rutina->id,
                    'id_ejercicio' => $item['idEjercicio'],
                    'series' => $item['series'],
                    'repeticiones' => $item['repeticiones'],
                    'peso' => $item['peso'] ?? 0,
                    'duracion_segundos' => $item['duracionSegundos'] ?? 0,
                    'descanso_segundos' => $item['descansoSegundos'] ?? 60,
                    'orden' => $item['orden'],
                    'observacion' => $item['observacion'] ?? null,
                ]);
            }

            return $rutina->load('rutinaEjercicios.ejercicio');
        });
    }
}
