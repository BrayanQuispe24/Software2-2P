<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Tipos de Ejercicio (Modalidades: Fuerza, Cardio, Calistenia, Movilidad)
        Schema::create('tipo_ejercicio', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 100)->unique();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        // 2. Grupos Musculares Anatómicos
        Schema::create('grupo_muscular', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // 3. Fichas Técnicas de Ejercicios
        Schema::create('ejercicios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->string('url_video', 255)->nullable();
            $table->string('equipamiento', 100)->nullable();
            $table->string('nivel_dificultad', 30)->default('PRINCIPIANTE');
            $table->string('mecanica', 50)->nullable(); // COMPUESTO, AISLADO
            $table->string('patron_movimiento', 50)->nullable(); // EMPUJE, TRACCION, BISAGRA, SENTADILLA
            
            $table->foreignUuid('id_tipo_ejercicio')->constrained('tipo_ejercicio')->restrictOnDelete();
            $table->timestamps();
        });

        // 4. Matriz N:M Ejercicio - Grupo Muscular
        Schema::create('ejercicio_grupo_muscular', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('id_ejercicio')->constrained('ejercicios')->cascadeOnDelete();
            $table->foreignUuid('id_grupo_muscular')->constrained('grupo_muscular')->cascadeOnDelete();
            $table->string('tipo_participacion', 30)->default('AGONISTA'); // AGONISTA, SINERGISTA, ESTABILIZADOR
            $table->text('observacion')->nullable();
            $table->timestamps();
        });

        // 5. Rutinas de Entrenamiento (Sesiones)
        Schema::create('rutinas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->string('nivel', 30)->default('INTERMEDIO');
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        // 6. Ejercicios Prescritos en la Rutina (Dosificación)
        Schema::create('rutina_ejercicio', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('id_rutina')->constrained('rutinas')->cascadeOnDelete();
            $table->foreignUuid('id_ejercicio')->constrained('ejercicios')->cascadeOnDelete();
            $table->integer('series')->default(3);
            $table->integer('repeticiones')->default(10);
            $table->decimal('peso', 8, 2)->nullable();
            $table->integer('duracion_segundos')->nullable();
            $table->integer('descanso_segundos')->default(60);
            $table->integer('orden')->default(1);
            $table->text('observacion')->nullable();
            $table->timestamps();
        });

        // 7. Planes de Entrenamiento (Macrociclos asignados a socios)
        Schema::create('plan_entrenamientos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_usuario')->index(); // Vínculo lógico con socio en ms-auth / ms-gimnasio
            $table->string('nombre', 150);
            $table->string('objetivo', 100);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->boolean('estado')->default(true);
            $table->text('observacion')->nullable();
            $table->timestamps();
        });

        // 8. Calendarización Semanal Plan - Rutinas
        Schema::create('plan_entrenamiento_rutina', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('id_plan_entrenamiento')->constrained('plan_entrenamientos')->cascadeOnDelete();
            $table->foreignUuid('id_rutina')->constrained('rutinas')->cascadeOnDelete();
            $table->string('dia_semana', 20); // LUNES, MARTES, etc.
            $table->timestamps();
        });

        // 9. Planes de Alimentación / Nutrición
        Schema::create('plan_alimentacion', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_usuario')->index(); // Vínculo lógico con socio
            $table->string('nombre', 150);
            $table->string('objetivo', 100);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->text('observacion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        // 10. Desglose de Comidas en el Plan Nutricional
        Schema::create('detalle_plan_alimentacion', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('id_plan_alimentacion')->constrained('plan_alimentacion')->cascadeOnDelete();
            $table->string('dia_semana', 20)->default('LUNES');
            $table->string('tipo_comida', 30); // DESAYUNO, MEDIA_MANANA, ALMUERZO, MERIENDA, CENA, POST_ENTRENO
            $table->string('alimento', 200);
            $table->decimal('cantidad', 8, 2)->default(100.00);
            $table->string('unidad', 50)->default('gramos');
            $table->time('hora')->nullable();
            $table->decimal('calorias', 8, 2)->nullable();
            $table->decimal('proteinas', 8, 2)->nullable();
            $table->decimal('carbohidratos', 8, 2)->nullable();
            $table->decimal('grasas', 8, 2)->nullable();
            $table->text('observacion')->nullable();
            $table->timestamps();
        });

        // 11. Expediente Clínico / Antropométrico Maestro
        Schema::create('historiales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_usuario')->unique(); // 1 expediente por socio
            $table->date('fecha_apertura');
            $table->text('observaciones_generales')->nullable();
            $table->string('grupo_sanguineo', 10)->nullable();
            $table->string('sexo', 20)->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->string('domicilio', 200)->nullable();
            $table->string('facultad_carrera', 150)->nullable();
            $table->string('celular_emergencia', 50)->nullable();
            $table->timestamps();
        });

        // 12. Mediciones Antropométricas y de Composición Corporal
        Schema::create('detalle_historial', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('id_historial')->constrained('historiales')->cascadeOnDelete();
            $table->decimal('peso', 8, 2); // kg
            $table->decimal('altura', 8, 2); // cm o metros
            $table->decimal('imc', 8, 2); // calculado peso / (altura_m ^ 2)
            $table->decimal('porcentaje_grasa', 8, 2)->nullable();
            $table->decimal('masa_muscular', 8, 2)->nullable();
            $table->string('presion', 30)->nullable();
            $table->timestamp('fecha_registro');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_historial');
        Schema::dropIfExists('historiales');
        Schema::dropIfExists('detalle_plan_alimentacion');
        Schema::dropIfExists('plan_alimentacion');
        Schema::dropIfExists('plan_entrenamiento_rutina');
        Schema::dropIfExists('plan_entrenamientos');
        Schema::dropIfExists('rutina_ejercicio');
        Schema::dropIfExists('rutinas');
        Schema::dropIfExists('ejercicio_grupo_muscular');
        Schema::dropIfExists('ejercicios');
        Schema::dropIfExists('grupo_muscular');
        Schema::dropIfExists('tipo_ejercicio');
    }
};
