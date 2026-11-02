<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Ambientes
        Schema::create('ambientes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');
            $table->timestamps();
        });

        // 2. Marcas
        Schema::create('marcas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 100)->unique();
            $table->string('estado', 20)->default('ACTIVO');
            $table->timestamps();
        });

        // 3. Tipos de Equipo
        Schema::create('tipo_equipo', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');
            $table->timestamps();
        });

        // 4. Tipos de Movimiento
        Schema::create('tipo_movimiento', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre', 50)->unique(); // ENTRADA, SALIDA, TRASLADO, BAJA, AJUSTE
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // 5. Equipos
        Schema::create('equipos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 150);
            $table->string('modelo', 100)->nullable();
            $table->date('fecha_adquisicion')->nullable();
            $table->decimal('precio_compra', 12, 2)->nullable();
            $table->string('estado', 30)->default('OPERATIVO'); // OPERATIVO, EN_MANTENIMIENTO, DE_BAJA
            $table->integer('cantidad')->default(1);

            // Claves foráneas internas
            $table->foreignUuid('id_ambiente')->constrained('ambientes')->restrictOnDelete();
            $table->foreignUuid('id_marca')->constrained('marcas')->restrictOnDelete();
            $table->foreignUuid('id_tipo_equipo')->constrained('tipo_equipo')->restrictOnDelete();

            $table->timestamps();
            $table->index('estado');
        });

        // 6. Mantenimientos
        Schema::create('mantenimientos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tipo', 30); // PREVENTIVO, CORRECTIVO
            $table->dateTime('fecha_inicio');
            $table->dateTime('fecha_fin')->nullable();
            $table->text('descripcion');
            $table->decimal('costo', 10, 2)->default(0.00);
            $table->string('estado', 30)->default('PROGRAMADO'); // PROGRAMADO, EN_PROCESO, COMPLETADO, CANCELADO
            $table->date('proximo_mantenimiento')->nullable();
            $table->text('observacion')->nullable();

            $table->foreignUuid('id_equipo')->constrained('equipos')->cascadeOnDelete();

            $table->timestamps();
            $table->index('estado');
            $table->index('proximo_mantenimiento');
        });

        // 7. Movimientos de Inventario (Kardex)
        Schema::create('movimiento_inventario', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamp('fecha_hora')->useCurrent();
            $table->string('motivo', 200);
            $table->text('observacion')->nullable();
            $table->integer('cantidad');

            $table->foreignUuid('id_equipo')->constrained('equipos')->restrictOnDelete();
            $table->foreignUuid('id_tipo_movimiento')->constrained('tipo_movimiento')->restrictOnDelete();

            // Referencia externa sin FK física (Database-per-Service)
            $table->uuid('id_usuario')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimiento_inventario');
        Schema::dropIfExists('mantenimientos');
        Schema::dropIfExists('equipos');
        Schema::dropIfExists('tipo_movimiento');
        Schema::dropIfExists('tipo_equipo');
        Schema::dropIfExists('marcas');
        Schema::dropIfExists('ambientes');
    }
};
