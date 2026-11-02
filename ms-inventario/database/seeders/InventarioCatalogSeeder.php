<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventarioCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambientes
        $ambientes = [
            ['nombre' => 'Sala de Musculación Principal', 'descripcion' => 'Área de pesas libres y máquinas isotónicas'],
            ['nombre' => 'Zona Cardio', 'descripcion' => 'Cintas, elípticas, escaladoras y bicicletas'],
            ['nombre' => 'Salón de Spinning', 'descripcion' => 'Bicicletas estáticas de alta gama'],
            ['nombre' => 'Área Funcional & Cross', 'descripcion' => 'Espacio con jaulas, kettlebells y balones medicinales'],
        ];

        foreach ($ambientes as $amb) {
            DB::table('ambientes')->updateOrInsert(
                ['nombre' => $amb['nombre']],
                [
                    'id' => Str::uuid()->toString(),
                    'descripcion' => $amb['descripcion'],
                    'estado' => 'ACTIVO',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 2. Marcas
        $marcas = [
            ['nombre' => 'Life Fitness'],
            ['nombre' => 'Technogym'],
            ['nombre' => 'Matrix Fitness'],
            ['nombre' => 'Hammer Strength'],
            ['nombre' => 'Rogue Fitness'],
        ];

        foreach ($marcas as $m) {
            DB::table('marcas')->updateOrInsert(
                ['nombre' => $m['nombre']],
                [
                    'id' => Str::uuid()->toString(),
                    'estado' => 'ACTIVO',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 3. Tipos de Equipo (tabla: tipo_equipo)
        $tipos = [
            ['nombre' => 'Caminadora Eléctrica Pro', 'descripcion' => 'Caminadora con pantalla táctil e inclinación electrónica'],
            ['nombre' => 'Bicicleta Spinning Estática', 'descripcion' => 'Bicicleta magnética con volante de inercia pesado'],
            ['nombre' => 'Prensa de Piernas 45°', 'descripcion' => 'Máquina para trabajo de cuadríceps y glúteos con discos'],
            ['nombre' => 'Jaula de Sentadillas Power Rack', 'descripcion' => 'Estructura robusta para press y sentadilla libre'],
            ['nombre' => 'Set Mancuernas Uretano 2.5kg a 40kg', 'descripcion' => 'Juego completo de mancuernas fijas'],
            ['nombre' => 'Máquina Elíptica', 'descripcion' => 'Bajo impacto articular con programas HIIT'],
        ];

        foreach ($tipos as $t) {
            DB::table('tipo_equipo')->updateOrInsert(
                ['nombre' => $t['nombre']],
                [
                    'id' => Str::uuid()->toString(),
                    'descripcion' => $t['descripcion'],
                    'estado' => 'ACTIVO',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Tipos de Movimiento de Kardex (tabla: tipo_movimiento)
        $tiposMov = [
            ['nombre' => 'ENTRADA', 'descripcion' => 'Entrada de equipos nuevos o adquisición'],
            ['nombre' => 'SALIDA', 'descripcion' => 'Salida definitiva o baja de equipos'],
            ['nombre' => 'TRASLADO', 'descripcion' => 'Traslado de equipo entre ambientes o sucursales'],
            ['nombre' => 'AJUSTE', 'descripcion' => 'Ajuste de inventario físico'],
            ['nombre' => 'BAJA', 'descripcion' => 'Baja por obsolescencia o daño irreparable'],
        ];

        foreach ($tiposMov as $tm) {
            DB::table('tipo_movimiento')->updateOrInsert(
                ['nombre' => $tm['nombre']],
                [
                    'id' => Str::uuid()->toString(),
                    'descripcion' => $tm['descripcion'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 5. Equipamiento Inicial de Demostración
        $cardioRoom = DB::table('ambientes')->where('nombre', 'Zona Cardio')->first();
        $muscRoom = DB::table('ambientes')->where('nombre', 'Sala de Musculación Principal')->first();
        $lifeFitness = DB::table('marcas')->where('nombre', 'Life Fitness')->first();
        $technogym = DB::table('marcas')->where('nombre', 'Technogym')->first();
        $caminadora = DB::table('tipo_equipo')->where('nombre', 'Caminadora Eléctrica Pro')->first();
        $prensa = DB::table('tipo_equipo')->where('nombre', 'Prensa de Piernas 45°')->first();

        if ($cardioRoom && $lifeFitness && $caminadora) {
            DB::table('equipos')->updateOrInsert(
                ['codigo' => 'EQ-CARDIO-001'],
                [
                    'id' => Str::uuid()->toString(),
                    'nombre' => 'Caminadora Elevation Series',
                    'modelo' => 'Discover SE3 HD',
                    'fecha_adquisicion' => '2025-01-15',
                    'precio_compra' => 4850.00,
                    'estado' => 'OPERATIVO',
                    'cantidad' => 6,
                    'id_ambiente' => $cardioRoom->id,
                    'id_marca' => $lifeFitness->id,
                    'id_tipo_equipo' => $caminadora->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        if ($muscRoom && $technogym && $prensa) {
            DB::table('equipos')->updateOrInsert(
                ['codigo' => 'EQ-MUSC-002'],
                [
                    'id' => Str::uuid()->toString(),
                    'nombre' => 'Prensa Inclinada Pure Strength',
                    'modelo' => 'PS-LegPress-45',
                    'fecha_adquisicion' => '2025-03-20',
                    'precio_compra' => 3200.00,
                    'estado' => 'OPERATIVO',
                    'cantidad' => 2,
                    'id_ambiente' => $muscRoom->id,
                    'id_marca' => $technogym->id,
                    'id_tipo_equipo' => $prensa->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
