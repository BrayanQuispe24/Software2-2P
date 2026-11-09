import { Rutina, CrearRutinaInput, RutinaPersonalizada, GuardarRutinaPersonalizadaInput } from '../models/rutina.model';

export interface RutinaRepositoryPort {
  listarRutinas(nivel?: string): Promise<Rutina[]>;
  obtenerRutinaPorId(id: string): Promise<Rutina | null>;
  crearRutina(input: CrearRutinaInput): Promise<Rutina>;

  // Métodos MongoDB (Rutinas Personalizadas Dinámicas)
  listarRutinasPersonalizadasPorUsuario(usuarioId: string): Promise<RutinaPersonalizada[]>;
  obtenerRutinaPersonalizadaPorId(id: string): Promise<RutinaPersonalizada | null>;
  guardarRutinaPersonalizada(input: GuardarRutinaPersonalizadaInput): Promise<RutinaPersonalizada>;
  eliminarRutinaPersonalizada(id: string): Promise<boolean>;
}
