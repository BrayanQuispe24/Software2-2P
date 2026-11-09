<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\RutinaPersonalizada;

class MigrarRutinasAMongoCommand extends Command
{
    /**
     * Nombre y firma del comando en Artisan.
     */
    protected $signature = 'rutinas:migrar-a-mongo {--dry-run : Ejecuta la simulación sin persistir en MongoDB}';

    /**
     * Descripción del comando.
     */
    protected $description = 'Extrae las rutinas relacionales de PostgreSQL y las migra a documentos MongoDB en rutinas_personalizadas';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $this->info("=== Iniciando proceso de migración: PostgreSQL -> MongoDB ===");
        if ($isDryRun) {
            $this->warn("MODO SIMULACIÓN (DRY-RUN) ACTIVO. No se escribirán datos.");
        }

        try {
            // Verificar conexión PostgreSQL
            $rutinasPg = DB::connection('pgsql')->table('rutinas')->get();
            $totalPg = $rutinasPg->count();
            $this->info("Total de rutinas encontradas en PostgreSQL: {$totalPg}");

            if ($totalPg === 0) {
                $this->warn("No hay rutinas registradas en PostgreSQL para migrar.");
                return 0;
            }

            $migradas = 0;
            $errores = 0;

            foreach ($rutinasPg as $rutina) {
                try {
                    // Obtener los ejercicios asociados a la rutina
                    $rutinaEjercicios = DB::connection('pgsql')
                        ->table('rutina_ejercicio')
                        ->leftJoin('ejercicios', 'rutina_ejercicio.id_ejercicio', '=', 'ejercicios.id')
                        ->where('rutina_ejercicio.id_rutina', $rutina->id)
                        ->orderBy('rutina_ejercicio.orden')
                        ->select(
                            'rutina_ejercicio.*',
                            'ejercicios.nombre as nombre_ejercicio',
                            'ejercicios.fuerza',
                            'ejercicios.equipamiento',
                            'ejercicios.nivel_dificultad'
                        )
                        ->get();

                    // Agrupar los ejercicios en un bloque inicial estructurado
                    $ejerciciosItems = [];
                    foreach ($rutinaEjercicios as $re) {
                        $ejerciciosItems[] = [
                            'ejercicioId' => $re->id_ejercicio,
                            'nombre' => $re->nombre_ejercicio ?? 'Ejercicio sin nombre',
                            'series' => (int) $re->series,
                            'repeticiones' => (int) $re->repeticiones,
                            'pesoKg' => $re->peso !== null ? (float) $re->peso : 0.0,
                            'duracionSegundos' => (int) ($re->duracion_segundos ?? 0),
                            'descansoSegundos' => (int) ($re->descanso_segundos ?? 60),
                            'notaTecnica' => $re->observacion,
                            'seriesDetalle' => [
                                [
                                    'set' => 1,
                                    'repeticiones' => (int) $re->repeticiones,
                                    'pesoKg' => $re->peso !== null ? (float) $re->peso : 0.0,
                                    'rpeObjetivo' => null,
                                    'duracionSegundos' => (int) ($re->duracion_segundos ?? 0),
                                    'descansoSegundos' => (int) ($re->descanso_segundos ?? 60),
                                    'nota' => $re->observacion,
                                ]
                            ]
                        ];
                    }

                    $bloquePrincipal = [
                        'orden' => 1,
                        'nombre' => 'Entrenamiento Principal',
                        'tipoBloque' => 'FUERZA',
                        'metodo' => 'CONVENCIONAL',
                        'protocolo' => null,
                        'rondas' => 1,
                        'intervaloTrabajoSeg' => null,
                        'intervaloDescansoSeg' => null,
                        'ejercicios' => $ejerciciosItems,
                    ];

                    $documento = [
                        'usuario_id' => '00000000-0000-0000-0000-000000000000', // Rutina base/plantilla
                        'nombre' => $rutina->nombre,
                        'descripcion' => $rutina->descripcion,
                        'objetivo' => 'ACONDICIONAMIENTO_GENERAL',
                        'tipo_entrenamiento' => 'CONVENCIONAL',
                        'nivel' => $rutina->nivel ?? 'INTERMEDIO',
                        'estado' => $rutina->estado ? 'ACTIVO' : 'INACTIVO',
                        'duracion_estimada_minutos' => 45,
                        'bloques' => [$bloquePrincipal],
                        'metadatos_creacion' => [
                            'migrado_desde_postgres' => true,
                            'postgres_rutina_id' => $rutina->id,
                            'fecha_migracion' => now()->toIso8601String(),
                        ]
                    ];

                    if (!$isDryRun) {
                        RutinaPersonalizada::create($documento);
                    }

                    $migradas++;
                    $this->line("  [OK] Rutina '{$rutina->nombre}' ({$rutina->id}) procesada.");
                } catch (\Throwable $e) {
                    $errores++;
                    $this->error("  [ERROR] Falló rutina '{$rutina->nombre}': " . $e->getMessage());
                }
            }

            $this->info("=== Proceso finalizado ===");
            $this->info("Exitosas: {$migradas} | Fallidas: {$errores}");

            return $errores === 0 ? 0 : 1;
        } catch (\Throwable $e) {
            $this->error("Error crítico durante la migración: " . $e->getMessage());
            return 1;
        }
    }
}

