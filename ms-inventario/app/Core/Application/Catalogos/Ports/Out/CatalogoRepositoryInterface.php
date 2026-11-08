<?php

declare(strict_types=1);

namespace App\Core\Application\Catalogos\Ports\Out;

use App\Core\Domain\Catalogos\Entities\Ambiente;
use App\Core\Domain\Catalogos\Entities\Marca;
use App\Core\Domain\Catalogos\Entities\TipoEquipo;
use App\Core\Domain\Catalogos\Entities\TipoMovimiento;

interface CatalogoRepositoryInterface
{
    public function saveAmbiente(Ambiente $ambiente): Ambiente;
    public function saveMarca(Marca $marca): Marca;
    public function saveTipoEquipo(TipoEquipo $tipo): TipoEquipo;
    public function saveTipoMovimiento(TipoMovimiento $tipo): TipoMovimiento;
}
