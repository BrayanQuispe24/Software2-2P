/**
 * Modelo de Dominio: Cliente / Socio
 * Representa la identidad del socio registrado en el ecosistema SSO de ApexFitness.
 */
export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  ci: string;
  celular?: string;
  email: string;
  tipoUsuario?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}
