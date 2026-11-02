<?php

declare(strict_types=1);

namespace App\Infrastructure\Adapters\In\GraphQL\Mutations;

use App\Core\Application\Equipos\UseCases\CrearEquipoUseCase;
use App\Models\Equipo as EquipoModel;

class CrearEquipoMutation
{
    public function __construct(
        private readonly CrearEquipoUseCase $useCase
    ) {}

    public function __invoke($_, array $args): EquipoModel
    {
        $input = $args['input'];

        $equipo = $this->useCase->execute(
            codigo: (string) $input['codigo'],
            nombre: (string) $input['nombre'],
            modelo: $input['modelo'] ?? null,
            fechaAdquisicion: $input['fechaAdquisicion'] ?? null,
            precioCompra: isset($input['precioCompra']) ? (float) $input['precioCompra'] : null,
            cantidadInicial: (int) ($input['cantidadInicial'] ?? 1),
            ambienteId: (string) $input['ambienteId'],
            marcaId: (string) $input['marcaId'],
            tipoEquipoId: (string) $input['tipoEquipoId']
        );

        return EquipoModel::findOrFail($equipo->getId());
    }
}
