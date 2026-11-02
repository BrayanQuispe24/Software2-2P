import { InjectionToken } from '@angular/core';
import { ICatalogoRepository } from '../../features/catalogo/domain/repositories/catalogo.repository';
import { IInscripcionRepository, IPagoRepository } from '../../features/inscripciones/domain/repositories/inscripcion.repository';
import { IControlAccesoRepository } from '../../features/control-acceso/domain/repositories/control-acceso.repository';
import { ClienteRepository } from '../../features/clientes/domain/repositories/cliente.repository';

export const CATALOGO_REPOSITORY = new InjectionToken<ICatalogoRepository>('CATALOGO_REPOSITORY');
export const INSCRIPCION_REPOSITORY = new InjectionToken<IInscripcionRepository>('INSCRIPCION_REPOSITORY');
export const PAGO_REPOSITORY = new InjectionToken<IPagoRepository>('PAGO_REPOSITORY');
export const CONTROL_ACCESO_REPOSITORY = new InjectionToken<IControlAccesoRepository>('CONTROL_ACCESO_REPOSITORY');
export const CLIENTE_REPOSITORY = new InjectionToken<ClienteRepository>('CLIENTE_REPOSITORY');
