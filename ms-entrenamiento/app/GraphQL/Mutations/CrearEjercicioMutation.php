<?php

namespace App\GraphQL\Mutations;

use App\Models\Ejercicio;
use App\Models\EjercicioGrupoMuscular;
use Illuminate\Support\Facades\DB;

class CrearEjercicioMutation
{
    public function __invoke($_, array $args): Ejercicio
    {
        $input = $args['input'];

        return DB::transaction(function () use ($input) {
            $ejercicio = Ejercicio::create([
                'nombre' => $input['nombre'],
                'descripcion' => $input['descripcion'] ?? null,
                'url_video' => $input['urlVideo'] ?? null,
                'equipamiento' => $input['equipamiento'] ?? null,
                'nivel_dificultad' => $input['nivelDificultad'],
                'mecanica' => $input['mecanica'] ?? null,
                'patron_movimiento' => $input['patronMovimiento'] ?? null,
                'id_tipo_ejercicio' => $input['idTipoEjercicio'],
            ]);

            if (!empty($input['gruposMusculares'])) {
                foreach ($input['gruposMusculares'] as $gm) {
                    EjercicioGrupoMuscular::create([
                        'id_ejercicio' => $ejercicio->id,
                        'id_grupo_muscular' => $gm['idGrupoMuscular'],
                        'tipo_participacion' => $gm['tipoParticipacion'],
                        'observacion' => $gm['observacion'] ?? null,
                    ]);
                }
            }

            return $ejercicio->load(['tipoEjercicio', 'gruposMusculares.grupoMuscular']);
        });
    }
}
