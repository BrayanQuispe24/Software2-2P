<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoEjercicio;
use App\Models\GrupoMuscular;
use App\Models\Ejercicio;
use App\Models\EjercicioGrupoMuscular;
use App\Models\Rutina;
use App\Models\RutinaEjercicio;
use App\Models\PlanEntrenamiento;
use App\Models\PlanEntrenamientoRutina;
use App\Models\PlanAlimentacion;
use App\Models\DetallePlanAlimentacion;
use App\Models\Historial;
use App\Models\DetalleHistorial;
use Carbon\Carbon;

class EntrenamientoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tipos de Ejercicio
        $tipoFuerza = TipoEjercicio::create(['nombre' => 'Fuerza e Hipertrofia', 'estado' => true]);
        $tipoCardio = TipoEjercicio::create(['nombre' => 'Cardiovascular y Resistencia', 'estado' => true]);
        $tipoCalistenia = TipoEjercicio::create(['nombre' => 'Calistenia y Peso Corporal', 'estado' => true]);
        $tipoMovilidad = TipoEjercicio::create(['nombre' => 'Movilidad y Estiramiento', 'estado' => true]);

        // 2. Grupos Musculares Anatómicos
        $gmPectoral = GrupoMuscular::create(['nombre' => 'Pectoral', 'descripcion' => 'Pecho superior, medio e inferior']);
        $gmEspalda = GrupoMuscular::create(['nombre' => 'Espalda / Dorsal', 'descripcion' => 'Dorsal ancho, redondo mayor y romboides']);
        $gmCuadriceps = GrupoMuscular::create(['nombre' => 'Cuádriceps', 'descripcion' => 'Muslo anterior']);
        $gmIsquiosGluteo = GrupoMuscular::create(['nombre' => 'Isquiotibiales y Glúteos', 'descripcion' => 'Cadena posterior inferior']);
        $gmHombros = GrupoMuscular::create(['nombre' => 'Deltoides / Hombros', 'descripcion' => 'Porción anterior, lateral y posterior']);
        $gmBiceps = GrupoMuscular::create(['nombre' => 'Bíceps', 'descripcion' => 'Braquial y bíceps braquial']);
        $gmTriceps = GrupoMuscular::create(['nombre' => 'Tríceps', 'descripcion' => 'Cabezas lateral, medial y larga']);
        $gmCore = GrupoMuscular::create(['nombre' => 'Core / Abdominales', 'descripcion' => 'Recto abdominal y oblicuos']);

        // 3. Catálogo de Ejercicios
        $ejPressBanca = Ejercicio::create([
            'nombre' => 'Press de Banca Plano con Barra',
            'descripcion' => 'Túmbate en el banco, retrae escápulas y desciende la barra hacia el esternón medio con control.',
            'url_video' => 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
            'equipamiento' => 'Barra Olímpica y Banco Plano',
            'nivel_dificultad' => 'INTERMEDIO',
            'mecanica' => 'COMPUESTO',
            'patron_movimiento' => 'EMPUJE_HORIZONTAL',
            'id_tipo_ejercicio' => $tipoFuerza->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPressBanca->id, 'id_grupo_muscular' => $gmPectoral->id, 'tipo_participacion' => 'AGONISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPressBanca->id, 'id_grupo_muscular' => $gmTriceps->id, 'tipo_participacion' => 'SINERGISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPressBanca->id, 'id_grupo_muscular' => $gmHombros->id, 'tipo_participacion' => 'ESTABILIZADOR']);

        $ejSentadilla = Ejercicio::create([
            'nombre' => 'Sentadilla Trasera con Barra',
            'descripcion' => 'Coloca la barra sobre los trapecios, mantén el torso firme y desciende hasta que los muslos queden paralelos.',
            'url_video' => 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
            'equipamiento' => 'Rack de Sentadillas y Barra Olímpica',
            'nivel_dificultad' => 'INTERMEDIO',
            'mecanica' => 'COMPUESTO',
            'patron_movimiento' => 'SENTADILLA',
            'id_tipo_ejercicio' => $tipoFuerza->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejSentadilla->id, 'id_grupo_muscular' => $gmCuadriceps->id, 'tipo_participacion' => 'AGONISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejSentadilla->id, 'id_grupo_muscular' => $gmIsquiosGluteo->id, 'tipo_participacion' => 'SINERGISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejSentadilla->id, 'id_grupo_muscular' => $gmCore->id, 'tipo_participacion' => 'ESTABILIZADOR']);

        $ejDominadas = Ejercicio::create([
            'nombre' => 'Dominadas Pronas Estrictas',
            'descripcion' => 'Agarre prono ligeramente superior al ancho de hombros, tracción explosiva hasta superar la barra con la barbilla.',
            'url_video' => 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
            'equipamiento' => 'Barra de Dominadas',
            'nivel_dificultad' => 'AVANZADO',
            'mecanica' => 'COMPUESTO',
            'patron_movimiento' => 'TRACCION_VERTICAL',
            'id_tipo_ejercicio' => $tipoCalistenia->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejDominadas->id, 'id_grupo_muscular' => $gmEspalda->id, 'tipo_participacion' => 'AGONISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejDominadas->id, 'id_grupo_muscular' => $gmBiceps->id, 'tipo_participacion' => 'SINERGISTA']);

        $ejPressMilitar = Ejercicio::create([
            'nombre' => 'Press Militar con Mancuernas',
            'descripcion' => 'Sentado con respaldo a 80°, empuje vertical controlado sin bloquear codos violentamente.',
            'url_video' => 'https://www.youtube.com/watch?v=qEwKCR5JCog',
            'equipamiento' => 'Mancuernas y Banco Ajustable',
            'nivel_dificultad' => 'PRINCIPIANTE',
            'mecanica' => 'COMPUESTO',
            'patron_movimiento' => 'EMPUJE_VERTICAL',
            'id_tipo_ejercicio' => $tipoFuerza->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPressMilitar->id, 'id_grupo_muscular' => $gmHombros->id, 'tipo_participacion' => 'AGONISTA']);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPressMilitar->id, 'id_grupo_muscular' => $gmTriceps->id, 'tipo_participacion' => 'SINERGISTA']);

        $ejHipThrust = Ejercicio::create([
            'nombre' => 'Hip Thrust con Barra en Banco',
            'descripcion' => 'Espalda apoyada a la altura de escápulas, empuje de cadera potente contrayendo glúteos en el punto máximo.',
            'url_video' => 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
            'equipamiento' => 'Barra Olímpica y Banco Plano',
            'nivel_dificultad' => 'INTERMEDIO',
            'mecanica' => 'COMPUESTO',
            'patron_movimiento' => 'BISAGRA',
            'id_tipo_ejercicio' => $tipoFuerza->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejHipThrust->id, 'id_grupo_muscular' => $gmIsquiosGluteo->id, 'tipo_participacion' => 'AGONISTA']);

        $ejPlancha = Ejercicio::create([
            'nombre' => 'Plancha Abdominal Isométrica',
            'descripcion' => 'Apoyo de antebrazos con cuerpo en línea recta sin elevar ni colapsar la pelvis.',
            'url_video' => 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
            'equipamiento' => 'Colchoneta',
            'nivel_dificultad' => 'PRINCIPIANTE',
            'mecanica' => 'AISLADO',
            'patron_movimiento' => 'ESTABILIZACION_CORE',
            'id_tipo_ejercicio' => $tipoCalistenia->id,
        ]);
        EjercicioGrupoMuscular::create(['id_ejercicio' => $ejPlancha->id, 'id_grupo_muscular' => $gmCore->id, 'tipo_participacion' => 'AGONISTA']);

        // 4. Rutinas
        $rutinaTorso = Rutina::create([
            'nombre' => 'Torso Potencia A',
            'descripcion' => 'Enfoque en pecho, espalda alta y deltoides anterior.',
            'nivel' => 'INTERMEDIO',
            'estado' => true,
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaTorso->id,
            'id_ejercicio' => $ejPressBanca->id,
            'series' => 4,
            'repeticiones' => 8,
            'peso' => 60.0,
            'descanso_segundos' => 90,
            'orden' => 1,
            'observacion' => 'RIR 2 en las dos primeras series',
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaTorso->id,
            'id_ejercicio' => $ejDominadas->id,
            'series' => 4,
            'repeticiones' => 6,
            'peso' => 0.0,
            'descanso_segundos' => 90,
            'orden' => 2,
            'observacion' => 'Con pausa isométrica de 1s arriba',
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaTorso->id,
            'id_ejercicio' => $ejPressMilitar->id,
            'series' => 3,
            'repeticiones' => 10,
            'peso' => 16.0,
            'descanso_segundos' => 60,
            'orden' => 3,
            'observacion' => 'Mancuernas de 16kg por mano',
        ]);

        $rutinaPierna = Rutina::create([
            'nombre' => 'Pierna e Hipertrofia B',
            'descripcion' => 'Énfasis en cuádriceps, glúteos y estabilidad lumbo-pélvica.',
            'nivel' => 'INTERMEDIO',
            'estado' => true,
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaPierna->id,
            'id_ejercicio' => $ejSentadilla->id,
            'series' => 4,
            'repeticiones' => 10,
            'peso' => 80.0,
            'descanso_segundos' => 120,
            'orden' => 1,
            'observacion' => 'Calentamiento progresivo previo',
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaPierna->id,
            'id_ejercicio' => $ejHipThrust->id,
            'series' => 4,
            'repeticiones' => 12,
            'peso' => 90.0,
            'descanso_segundos' => 90,
            'orden' => 2,
            'observacion' => 'Apoyo firme con almohadilla',
        ]);
        RutinaEjercicio::create([
            'id_rutina' => $rutinaPierna->id,
            'id_ejercicio' => $ejPlancha->id,
            'series' => 3,
            'repeticiones' => 1,
            'duracion_segundos' => 60,
            'descanso_segundos' => 45,
            'orden' => 3,
            'observacion' => 'Sostener 60 segundos por serie',
        ]);

        // 5. Socio Demostrativo (Carlos Mendoza Rivera del SSO)
        $socioId = 'c2000000-0000-0000-0000-000000000001';

        // 6. Plan de Entrenamiento Asignado
        $plan = PlanEntrenamiento::create([
            'id_usuario' => $socioId,
            'nombre' => 'Mesociclo de Fuerza & Hipertrofia 8 Semanas',
            'objetivo' => 'Aumento de masa muscular magra y fuerza base',
            'fecha_inicio' => Carbon::now()->startOfWeek()->toDateString(),
            'fecha_fin' => Carbon::now()->startOfWeek()->addWeeks(8)->toDateString(),
            'estado' => true,
            'observacion' => 'Progresión lineal de cargas cada 2 semanas',
        ]);

        PlanEntrenamientoRutina::create([
            'id_plan_entrenamiento' => $plan->id,
            'id_rutina' => $rutinaTorso->id,
            'dia_semana' => 'LUNES',
        ]);
        PlanEntrenamientoRutina::create([
            'id_plan_entrenamiento' => $plan->id,
            'id_rutina' => $rutinaPierna->id,
            'dia_semana' => 'MIERCOLES',
        ]);
        PlanEntrenamientoRutina::create([
            'id_plan_entrenamiento' => $plan->id,
            'id_rutina' => $rutinaTorso->id,
            'dia_semana' => 'VIERNES',
        ]);

        // 7. Plan de Alimentación Asignado
        $dieta = PlanAlimentacion::create([
            'id_usuario' => $socioId,
            'nombre' => 'Pauta Nutricional Hiperproteica Normocalórica',
            'objetivo' => 'Mantenimiento con recomposición corporal',
            'fecha_inicio' => Carbon::now()->startOfWeek()->toDateString(),
            'fecha_fin' => Carbon::now()->startOfWeek()->addWeeks(8)->toDateString(),
            'observacion' => 'Consumir mínimo 2.5 litros de agua al día y creatina 5g post-entreno.',
            'estado' => true,
        ]);

        DetallePlanAlimentacion::create([
            'id_plan_alimentacion' => $dieta->id,
            'dia_semana' => 'LUNES',
            'tipo_comida' => 'DESAYUNO',
            'alimento' => 'Huevos revueltos con avena y manzana',
            'cantidad' => 3.0,
            'unidad' => 'unidades / 60g avena',
            'hora' => '07:30:00',
            'calorias' => 450.0,
            'proteinas' => 30.0,
            'carbohidratos' => 50.0,
            'grasas' => 14.0,
            'observacion' => 'Acompañar con café negro o té verde',
        ]);

        DetallePlanAlimentacion::create([
            'id_plan_alimentacion' => $dieta->id,
            'dia_semana' => 'LUNES',
            'tipo_comida' => 'ALMUERZO',
            'alimento' => 'Pechuga de pollo a la plancha con arroz integral y verduras al vapor',
            'cantidad' => 200.0,
            'unidad' => 'gramos pollo / 150g arroz',
            'hora' => '13:00:00',
            'calorias' => 650.0,
            'proteinas' => 48.0,
            'carbohidratos' => 65.0,
            'grasas' => 12.0,
            'observacion' => 'Cocinar con aceite de oliva extra virgen (1 cucharadita)',
        ]);

        DetallePlanAlimentacion::create([
            'id_plan_alimentacion' => $dieta->id,
            'dia_semana' => 'LUNES',
            'tipo_comida' => 'MERIENDA',
            'alimento' => 'Yogurt griego con frutos secos y proteína de suero (whey)',
            'cantidad' => 200.0,
            'unidad' => 'gramos',
            'hora' => '17:00:00',
            'calorias' => 320.0,
            'proteinas' => 28.0,
            'carbohidratos' => 20.0,
            'grasas' => 10.0,
            'observacion' => 'Ingesta 1 hora antes del entrenamiento vespertino',
        ]);

        DetallePlanAlimentacion::create([
            'id_plan_alimentacion' => $dieta->id,
            'dia_semana' => 'LUNES',
            'tipo_comida' => 'CENA',
            'alimento' => 'Filete de pescado blanco con ensalada verde y puré de camote',
            'cantidad' => 220.0,
            'unidad' => 'gramos pescado',
            'hora' => '20:30:00',
            'calorias' => 480.0,
            'proteinas' => 40.0,
            'carbohidratos' => 45.0,
            'grasas' => 8.0,
            'observacion' => 'Cena ligera de rápida asimilación',
        ]);

        // 8. Expediente y Mediciones Antropométricas
        $historial = Historial::create([
            'id_usuario' => $socioId,
            'fecha_apertura' => Carbon::now()->subMonths(2)->toDateString(),
            'observaciones_generales' => 'Apto para actividad física de alta intensidad. Sin lesiones articulares previas.',
            'grupo_sanguineo' => 'O+',
            'sexo' => 'MASCULINO',
            'fecha_nacimiento' => '1996-05-14',
            'domicilio' => 'Av. Principal #450, Sopocachi',
            'facultad_carrera' => 'Ingeniería de Sistemas',
            'celular_emergencia' => '+591 71234567',
        ]);

        // Medición inicial (hace 30 días)
        DetalleHistorial::create([
            'id_historial' => $historial->id,
            'peso' => 81.20,
            'altura' => 1.76,
            'imc' => round(81.20 / (1.76 * 1.76), 2),
            'porcentaje_grasa' => 20.50,
            'masa_muscular' => 35.10,
            'presion' => '120/80',
            'fecha_registro' => Carbon::now()->subDays(30),
        ]);

        // Medición actual
        DetalleHistorial::create([
            'id_historial' => $historial->id,
            'peso' => 78.50,
            'altura' => 1.76,
            'imc' => round(78.50 / (1.76 * 1.76), 2),
            'porcentaje_grasa' => 18.20,
            'masa_muscular' => 36.40,
            'presion' => '118/78',
            'fecha_registro' => Carbon::now()->subDays(2),
        ]);
    }
}
