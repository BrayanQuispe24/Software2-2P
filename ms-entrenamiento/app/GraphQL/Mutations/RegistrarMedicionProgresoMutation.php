<?php

namespace App\GraphQL\Mutations;

use App\Models\DetalleHistorial;
use App\Models\Historial;
use Illuminate\Support\Facades\DB;

class RegistrarMedicionProgresoMutation
{
    public function __invoke($_, array $args): DetalleHistorial
    {
        $input = $args['input'];

        return DB::transaction(function () use ($input) {
            $historial = Historial::firstOrCreate(
                ['id_usuario' => $input['idUsuario']],
                ['fecha_apertura' => now()->toDateString()]
            );

            $altura = (float) $input['altura'];
            if ($altura > 3.0) {
                // If provided in cm (e.g. 178), convert to meters (1.78)
                $altura = round($altura / 100, 2);
            }

            $peso = (float) $input['peso'];
            $imc = ($altura > 0) ? round($peso / ($altura * $altura), 2) : 0;

            return DetalleHistorial::create([
                'id_historial' => $historial->id,
                'peso' => $peso,
                'altura' => $altura,
                'imc' => $imc,
                'porcentaje_grasa' => $input['porcentajeGrasa'] ?? null,
                'masa_muscular' => $input['masaMuscular'] ?? null,
                'presion' => $input['presion'] ?? null,
                'fecha_registro' => now(),
            ]);
        });
    }
}
