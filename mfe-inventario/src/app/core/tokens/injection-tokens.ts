import { InjectionToken } from '@angular/core';
import { EquipoRepositoryPort } from '../../features/equipos/domain/ports/equipo-repository.port';
import { MantenimientoRepositoryPort } from '../../features/mantenimientos/domain/ports/mantenimiento-repository.port';
import { MovimientoRepositoryPort } from '../../features/inventario/domain/ports/movimiento-repository.port';

export const EQUIPO_REPOSITORY = new InjectionToken<EquipoRepositoryPort>('EQUIPO_REPOSITORY');
export const MANTENIMIENTO_REPOSITORY = new InjectionToken<MantenimientoRepositoryPort>('MANTENIMIENTO_REPOSITORY');
export const MOVIMIENTO_REPOSITORY = new InjectionToken<MovimientoRepositoryPort>('MOVIMIENTO_REPOSITORY');
