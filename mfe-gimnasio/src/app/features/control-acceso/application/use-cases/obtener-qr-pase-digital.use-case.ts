import { Injectable, inject } from '@angular/core';
import { IControlAccesoRepository } from '../../domain/repositories/control-acceso.repository';
import { ControlAccesoGraphQLRepository } from '../../infrastructure/adapters/control-acceso-graphql.repository';

@Injectable({
  providedIn: 'root',
})
export class ObtenerQrPaseDigitalUseCase {
  private readonly repo: IControlAccesoRepository = inject(ControlAccesoGraphQLRepository);

  execute(inscripcionId: string): Promise<string> {
    return this.repo.obtenerQrPaseDigital(inscripcionId);
  }
}
