export type TipoIncidencia =
  | 'luminarias dañadas'
  | 'baches'
  | 'señalización deteriorada'
  | 'alcantarillas obstruidas'
  | 'daños en parques';

export type EstadoIncidencia = 'pendiente' | 'en proceso' | 'resuelta';

export type PrioridadIncidencia = 'baja' | 'media' | 'alta';

export interface Incidencia {
  id: string;
  tipo: TipoIncidencia;
  descripcion: string;
  direccion: string;
  sector: string;
  fecha: string;
  estado: EstadoIncidencia;
  prioridad: PrioridadIncidencia;
  fotografia: string;
  latitud: number;
  longitud: number;
  observacion: string;
}
