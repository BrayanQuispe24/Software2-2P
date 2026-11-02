import { Injectable, inject } from '@angular/core';
import { IControlAccesoRepository, ValidarAccesoQrInput } from '../../domain/repositories/control-acceso.repository';
import { ControlAccesoGraphQLRepository } from '../../infrastructure/adapters/control-acceso-graphql.repository';
import { ValidacionAccesoResult } from '../../domain/models/acceso.model';

@Injectable({
  providedIn: 'root',
})
export class ValidarAccesoQrUseCase {
  private readonly repo: IControlAccesoRepository = inject(ControlAccesoGraphQLRepository);

  execute(input: ValidarAccesoQrInput): Promise<ValidacionAccesoResult> {
    return this.repo.validarAccesoPorQr(input);
  }
}
