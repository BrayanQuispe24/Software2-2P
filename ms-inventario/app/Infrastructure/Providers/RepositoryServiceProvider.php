<?php

declare(strict_types=1);

namespace App\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use App\Core\Application\Equipos\Ports\Out\EquipoRepositoryInterface;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories\EloquentEquipoRepository;
use App\Core\Application\Mantenimientos\Ports\Out\MantenimientoRepositoryInterface;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories\EloquentMantenimientoRepository;
use App\Core\Application\Inventario\Ports\Out\MovimientoInventarioRepositoryInterface;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories\EloquentMovimientoRepository;
use App\Core\Application\Catalogos\Ports\Out\CatalogoRepositoryInterface;
use App\Infrastructure\Adapters\Out\Persistence\Eloquent\Repositories\EloquentCatalogoRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(EquipoRepositoryInterface::class, EloquentEquipoRepository::class);
        $this->app->bind(MantenimientoRepositoryInterface::class, EloquentMantenimientoRepository::class);
        $this->app->bind(MovimientoInventarioRepositoryInterface::class, EloquentMovimientoRepository::class);
        $this->app->bind(CatalogoRepositoryInterface::class, EloquentCatalogoRepository::class);
    }
}
