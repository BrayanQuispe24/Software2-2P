<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ejercicios', function (Blueprint $table) {
            $table->string('external_id', 100)->nullable()->index()->after('id');
            $table->json('imagenes')->nullable()->after('url_video');
            $table->string('fuerza', 30)->nullable()->after('mecanica');
        });
    }

    public function down(): void
    {
        Schema::table('ejercicios', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'imagenes', 'fuerza']);
        });
    }
};
