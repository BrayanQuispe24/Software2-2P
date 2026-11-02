export const ALERTAS_MANTENIMIENTO_QUERY = `
  query AlertasMantenimiento($diasMargen: Int) {
    alertasMantenimientoProximo(diasMargen: $diasMargen) {
      id
      tipo
      fechaInicio
      fechaFin
      descripcion
      costo
      estado
      proximoMantenimiento
      observacion
      equipo {
        id
        nombre
        codigo
      }
    }
  }
`;

export const MANTENIMIENTOS_POR_EQUIPO_QUERY = `
  query MantenimientosPorEquipo($equipoId: ID) {
    mantenimientos(equipoId: $equipoId) {
      id
      tipo
      fechaInicio
      fechaFin
      descripcion
      costo
      estado
      proximoMantenimiento
      observacion
      equipo {
        id
        nombre
      }
    }
  }
`;

export const PROGRAMAR_MANTENIMIENTO_MUTATION = `
  mutation ProgramarMantenimiento($input: ProgramarMantenimientoInput!) {
    programarMantenimiento(input: $input) {
      id
      tipo
      fechaInicio
      descripcion
      costo
      estado
      proximoMantenimiento
      observacion
      equipo {
        id
        nombre
      }
    }
  }
`;

export const COMPLETAR_MANTENIMIENTO_MUTATION = `
  mutation CompletarMantenimiento($id: ID!, $costoFinal: Float!, $observacion: String) {
    completarMantenimiento(id: $id, costoFinal: $costoFinal, observacion: $observacion) {
      id
      costo
      estado
      observacion
    }
  }
`;
