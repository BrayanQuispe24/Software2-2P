<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\TipoEjercicio;
use App\Models\GrupoMuscular;
use App\Models\Ejercicio;
use App\Models\EjercicioGrupoMuscular;

class ImportarCatalogoEjerciciosSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('data/exercises.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("Archivo exercises.json no encontrado en: {$jsonPath}");
            return;
        }

        $jsonContent = file_get_contents($jsonPath);
        $exercises = json_decode($jsonContent, true);

        if (!is_array($exercises)) {
            $this->command->error("El archivo exercises.json no contiene un array JSON válido.");
            return;
        }

        $this->command->info("Iniciando importación masiva de " . count($exercises) . " ejercicios...");

        // 1. Tipos de Ejercicio / Categorías
        $categoriasDef = [
            'strength' => 'Fuerza e Hipertrofia',
            'cardio' => 'Cardiovascular y Resistencia',
            'stretching' => 'Movilidad y Flexibilidad',
            'plyometrics' => 'Pliometría y Potencia',
            'powerlifting' => 'Powerlifting',
            'olympic weightlifting' => 'Halterofilia Olímpica',
            'strongman' => 'Strongman y Cargas Masivas',
        ];

        $tiposModel = [];
        foreach ($categoriasDef as $catKey => $nombre) {
            $tipo = TipoEjercicio::firstOrCreate(
                ['nombre' => $nombre],
                ['estado' => true]
            );
            $tiposModel[$catKey] = $tipo->id;
        }
        // Fallback por si hay categorías no listadas
        $tipoGeneral = TipoEjercicio::firstOrCreate(['nombre' => 'General y Funcional'], ['estado' => true]);

        // 2. Grupos Musculares Anatómicos
        $musculosDef = [
            'abdominals' => ['nombre' => 'Abdominales y Core', 'descripcion' => 'Recto abdominal, transverso y oblicuos'],
            'abductors' => ['nombre' => 'Abductores', 'descripcion' => 'Glúteo medio, menor y tensor de la fascia lata'],
            'adductors' => ['nombre' => 'Aductores', 'descripcion' => 'Aductor mayor, largo y corto del muslo interior'],
            'biceps' => ['nombre' => 'Bíceps', 'descripcion' => 'Bíceps braquial y braquial anterior'],
            'calves' => ['nombre' => 'Gemelos y Pantorrillas', 'descripcion' => 'Gastrocnemio y sóleo'],
            'chest' => ['nombre' => 'Pectoral', 'descripcion' => 'Pectoral mayor y menor'],
            'forearms' => ['nombre' => 'Antebrazos', 'descripcion' => 'Flexores y extensores de la muñeca'],
            'glutes' => ['nombre' => 'Glúteos', 'descripcion' => 'Glúteo mayor, medio y menor'],
            'hamstrings' => ['nombre' => 'Isquiotibiales', 'descripcion' => 'Bíceps femoral, semitendinoso y semimembranoso'],
            'lats' => ['nombre' => 'Dorsales', 'descripcion' => 'Dorsal ancho y redondo mayor'],
            'lower back' => ['nombre' => 'Espalda Baja / Lumbar', 'descripcion' => 'Erectores espinales y cuadrado lumbar'],
            'middle back' => ['nombre' => 'Espalda Media', 'descripcion' => 'Romboides y trapecio medio'],
            'neck' => ['nombre' => 'Cuello', 'descripcion' => 'Esternocleidomastoideo y esplenio'],
            'quadriceps' => ['nombre' => 'Cuádriceps', 'descripcion' => 'Recto femoral y vastos del muslo anterior'],
            'shoulders' => ['nombre' => 'Deltoides / Hombros', 'descripcion' => 'Porción anterior, lateral y posterior'],
            'traps' => ['nombre' => 'Trapecios', 'descripcion' => 'Trapecio superior y fibras claviculares'],
            'triceps' => ['nombre' => 'Tríceps', 'descripcion' => 'Cabezas lateral, medial y larga del tríceps'],
        ];

        $gruposModel = [];
        foreach ($musculosDef as $key => $meta) {
            $gm = GrupoMuscular::firstOrCreate(
                ['nombre' => $meta['nombre']],
                ['descripcion' => $meta['descripcion']]
            );
            $gruposModel[$key] = $gm->id;
        }

        // Mappings
        $nivelMap = [
            'beginner' => 'PRINCIPIANTE',
            'intermediate' => 'INTERMEDIO',
            'expert' => 'AVANZADO',
        ];

        $mecanicaMap = [
            'compound' => 'COMPUESTO',
            'isolation' => 'AISLADO',
        ];

        $fuerzaMap = [
            'push' => 'EMPUJE',
            'pull' => 'TRACCION',
            'static' => 'ESTATICO',
        ];

        // 3. Procesamiento en Lotes
        $chunks = array_chunk($exercises, 100);
        $totalImportados = 0;

        foreach ($chunks as $chunk) {
            DB::transaction(function () use ($chunk, $tiposModel, $tipoGeneral, $gruposModel, $nivelMap, $mecanicaMap, $fuerzaMap, &$totalImportados) {
                foreach ($chunk as $item) {
                    $externalId = $item['id'] ?? null;
                    $nombre = trim($item['name'] ?? 'Ejercicio');
                    $instructions = isset($item['instructions']) && is_array($item['instructions'])
                        ? implode("\n\n", $item['instructions'])
                        : ($item['instructions'] ?? '');

                    $catKey = $item['category'] ?? '';
                    $idTipo = $tiposModel[$catKey] ?? $tipoGeneral->id;

                    $level = $item['level'] ?? 'intermediate';
                    $nivelDificultad = $nivelMap[$level] ?? 'INTERMEDIO';

                    $mechanic = $item['mechanic'] ?? null;
                    $mecanica = $mechanic ? ($mecanicaMap[$mechanic] ?? 'COMPUESTO') : null;

                    $force = $item['force'] ?? null;
                    $fuerza = $force ? ($fuerzaMap[$force] ?? null) : null;
                    $patron = $fuerza ?? ($mecanica ?? 'GENERAL');

                    $equip = !empty($item['equipment']) ? ucfirst($item['equipment']) : 'Peso Corporal';
                    $images = $item['images'] ?? [];

                    // Buscar o crear Ejercicio por external_id o nombre
                    $ejercicio = Ejercicio::where('external_id', $externalId)->first();
                    if (!$ejercicio) {
                        $ejercicio = Ejercicio::where('nombre', $nombre)->first();
                    }

                    if (!$ejercicio) {
                        $ejercicio = new Ejercicio();
                    }

                    $ejercicio->external_id = $externalId;
                    $ejercicio->nombre = substr($nombre, 0, 150);
                    $ejercicio->descripcion = $instructions;
                    $ejercicio->equipamiento = substr($equip, 0, 100);
                    $ejercicio->nivel_dificultad = $nivelDificultad;
                    $ejercicio->mecanica = $mecanica;
                    $ejercicio->fuerza = $fuerza;
                    $ejercicio->patron_movimiento = $patron;
                    $ejercicio->id_tipo_ejercicio = $idTipo;
                    $ejercicio->imagenes = $images;
                    $ejercicio->save();

                    // Músculos
                    EjercicioGrupoMuscular::where('id_ejercicio', $ejercicio->id)->delete();

                    if (!empty($item['primaryMuscles']) && is_array($item['primaryMuscles'])) {
                        foreach ($item['primaryMuscles'] as $musculoKey) {
                            if (isset($gruposModel[$musculoKey])) {
                                EjercicioGrupoMuscular::create([
                                    'id_ejercicio' => $ejercicio->id,
                                    'id_grupo_muscular' => $gruposModel[$musculoKey],
                                    'tipo_participacion' => 'PRIMARIO',
                                    'observacion' => 'Músculo motor principal / Agonista',
                                ]);
                            }
                        }
                    }

                    if (!empty($item['secondaryMuscles']) && is_array($item['secondaryMuscles'])) {
                        foreach ($item['secondaryMuscles'] as $musculoKey) {
                            if (isset($gruposModel[$musculoKey])) {
                                EjercicioGrupoMuscular::create([
                                    'id_ejercicio' => $ejercicio->id,
                                    'id_grupo_muscular' => $gruposModel[$musculoKey],
                                    'tipo_participacion' => 'SECUNDARIO',
                                    'observacion' => 'Músculo sinergista o estabilizador',
                                ]);
                            }
                        }
                    }

                    $totalImportados++;
                }
            });
            $this->command->info("Lote procesado: {$totalImportados} ejercicios guardados...");
        }

        $this->command->info("¡Importación finalizada con éxito! Total: {$totalImportados} ejercicios registrados.");
    }
}
