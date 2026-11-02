export const EQUIPOS_QUERY = `
  query Equipos($estado: EstadoEquipo, $ambienteId: ID, $marcaId: ID) {
    equipos(estado: $estado, ambienteId: $ambienteId, marcaId: $marcaId) {
      data {
        id
        codigo
        nombre
        modelo
        fechaAdquisicion
        precioCompra
        estado
        cantidad
        ambiente {
          id
          nombre
          descripcion
        }
        marca {
          id
          nombre
        }
        tipoEquipo {
          id
          nombre
          descripcion
        }
      }
    }
  }
`;

export const CREAR_EQUIPO_MUTATION = `
  mutation CrearEquipo($input: CrearEquipoInput!) {
    crearEquipo(input: $input) {
      id
      codigo
      nombre
      modelo
      fechaAdquisicion
      precioCompra
      estado
      cantidad
      ambiente {
        id
        nombre
      }
      marca {
        id
        nombre
      }
      tipoEquipo {
        id
        nombre
      }
    }
  }
`;

export const ACTUALIZAR_ESTADO_EQUIPO_MUTATION = `
  mutation ActualizarEstado($id: ID!, $nuevoEstado: EstadoEquipo!) {
    actualizarEstadoEquipo(id: $id, nuevoEstado: $nuevoEstado) {
      id
      estado
    }
  }
`;

export const CATALOGOS_QUERY = `
  query Catalogos {
    ambientes {
      id
      nombre
      descripcion
      estado
    }
    marcas {
      id
      nombre
      estado
    }
    tiposEquipo {
      id
      nombre
      descripcion
      estado
    }
  }
`;

export const CREAR_AMBIENTE_MUTATION = `
  mutation CrearAmbiente($nombre: String!, $descripcion: String) {
    crearAmbiente(nombre: $nombre, descripcion: $descripcion) {
      id
      nombre
      descripcion
      estado
    }
  }
`;

export const CREAR_MARCA_MUTATION = `
  mutation CrearMarca($nombre: String!) {
    crearMarca(nombre: $nombre) {
      id
      nombre
      estado
    }
  }
`;
