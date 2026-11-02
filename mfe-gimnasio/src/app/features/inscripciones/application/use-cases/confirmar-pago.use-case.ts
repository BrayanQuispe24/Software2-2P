import { IPagoRepository, ConfirmarPagoInput } from '../../domain/repositories/inscripcion.repository';
import { BoletaPago } from '../../domain/models/inscripcion.model';

export class ConfirmarPagoUseCase {
  constructor(private readonly repository: IPagoRepository) {}

  execute(input: ConfirmarPagoInput): Promise<BoletaPago> {
    if (!input.boletaPagoId || !input.codigoTransaccionExterna) {
      throw new Error('ID de boleta y código de transacción bancaria son obligatorios.');
    }
    return this.repository.confirmarPago(input);
  }
}
