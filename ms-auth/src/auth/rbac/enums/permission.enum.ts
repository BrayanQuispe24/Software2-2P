export enum Permission {
  USERS_READ = 'usuarios.leer',
  USERS_CREATE = 'usuarios.crear',
  USERS_UPDATE = 'usuarios.actualizar',
  USERS_DELETE = 'usuarios.eliminar',

  ENROLLMENTS_READ = 'inscripciones.leer',
  ENROLLMENTS_MANAGE = 'inscripciones.gestionar',

  CLASSES_READ = 'clases.leer',
  CLASSES_MANAGE = 'clases.gestionar',
  CLASSES_ENROLL = 'clases.inscribirse',

  PROFILE_READ = 'perfil.leer',
}
