export const KARDEX_QUERY = `
  query KardexPorEquipo($equipoId: ID!) {
    kardexPorEquipo(equipoId: $equipoId) {
      id
      fechaHora
      motivo
      observacion
      cantidad
      equipo {
        id
        nombre
      }
      tipoMovimiento {
        id
        nombre
        descripcion
      }
      usuarioId
    }
  }
`;

export const REGISTRAR_MOVIMIENTO_MUTATION = `
  mutation RegistrarMovimiento($input: RegistrarMovimientoInput!) {
    registrarMovimientoInventario(input: $input) {
      id
      fechaHora
      motivo
      observacion
      cantidad
      equipo {
        id
        nombre
        cantidad
      }
      tipoMovimiento {
        id
        nombre
      }
      usuarioId
    }
  }
`;

export const TIPOS_MOVIMIENTO_QUERY = `
  query TiposMovimiento {
    tiposMovimiento {
      id
      nombre
      descripcion
    }
  }
`;
