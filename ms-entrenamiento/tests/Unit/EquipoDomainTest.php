<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Domain\Equipos\Entities\Equipo;
use App\Core\Domain\Equipos\Enums\EstadoEquipo;
use App\Core\Domain\Inventario\Exceptions\StockInsuficienteException;
use PHPUnit\Framework\TestCase;

class EquipoDomainTest extends TestCase
{
    public function test_puede_reducir_stock_satisfactoriamente(): void
    {
        $equipo = new Equipo(
            id: 'uuid-1',
            codigo: 'EQ-001',
            nombre: 'Caminadora Pro',
            modelo: 'T-900',
            fechaAdquisicion: null,
            precioCompra: 1500.0,
            estado: EstadoEquipo::OPERATIVO,
            cantidad: 10,
            ambienteId: 'amb-1',
            marcaId: 'marca-1',
            tipoEquipoId: 'tipo-1'
        );

        $equipo->reducirStock(4);

        $this->assertEquals(6, $equipo->getCantidad());
    }

    public function test_lanza_excepcion_si_stock_es_insuficiente(): void
    {
        $this->expectException(StockInsuficienteException::class);

        $equipo = new Equipo(
            id: 'uuid-1',
            codigo: 'EQ-002',
            nombre: 'Bicicleta Estática',
            modelo: 'B-200',
            fechaAdquisicion: null,
            precioCompra: 800.0,
            estado: EstadoEquipo::OPERATIVO,
            cantidad: 2,
            ambienteId: 'amb-1',
            marcaId: 'marca-1',
            tipoEquipoId: 'tipo-1'
        );

        $equipo->reducirStock(5);
    }

    public function test_transicion_de_estado_a_en_mantenimiento(): void
    {
        $equipo = new Equipo(
            id: 'uuid-1',
            codigo: 'EQ-003',
            nombre: 'Prensa de Piernas',
            modelo: null,
            fechaAdquisicion: null,
            precioCompra: 2000.0,
            estado: EstadoEquipo::OPERATIVO,
            cantidad: 1,
            ambienteId: 'amb-1',
            marcaId: 'marca-1',
            tipoEquipoId: 'tipo-1'
        );

        $equipo->entrarEnMantenimiento();
        $this->assertEquals(EstadoEquipo::EN_MANTENIMIENTO, $equipo->getEstado());

        $equipo->retornarAOperativo();
        $this->assertEquals(EstadoEquipo::OPERATIVO, $equipo->getEstado());
    }
}
