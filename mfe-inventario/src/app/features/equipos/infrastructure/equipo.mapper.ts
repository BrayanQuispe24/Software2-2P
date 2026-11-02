import { Equipo } from '../domain/models/equipo.model';
import { EstadoEquipo } from '../domain/enums/estado-equipo.enum';

export class EquipoMapper {
  static toDomain(dto: any): Equipo {
    return {
      id: dto.id,
      codigo: dto.codigo,
      nombre: dto.nombre,
      modelo: dto.modelo || undefined,
      fechaAdquisicion: dto.fechaAdquisicion || undefined,
      precioCompra: dto.precioCompra !== null ? Number(dto.precioCompra) : undefined,
      estado: dto.estado as EstadoEquipo,
      cantidad: Number(dto.cantidad),
      ambiente: {
        id: dto.ambiente?.id,
        nombre: dto.ambiente?.nombre || 'Sin Ambiente',
        descripcion: dto.ambiente?.descripcion,
      },
      marca: {
        id: dto.marca?.id,
        nombre: dto.marca?.nombre || 'Sin Marca',
      },
      tipoEquipo: {
        id: dto.tipoEquipo?.id,
        nombre: dto.tipoEquipo?.nombre || 'General',
        descripcion: dto.tipoEquipo?.descripcion,
      },
    };
  }
}
