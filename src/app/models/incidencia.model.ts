export type TipoIncidencia =
  'luminarias dañadas' | 'baches' | 'señalización deteriorada' | 'alcantarillas obstruidas' | 'daños en parques';

export type EstadoIncidencia = 'pendiente' | 'en proceso' | 'resuelta';

export type PrioridadIncidencia = 'baja' | 'media' | 'alta';

export interface Incidencia {
  id: string;
  codigo?: string;
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

export function identificadoresIncidencia(incidencia: Pick<Incidencia, 'id' | 'codigo'>): string[] {
  return [
    ...new Set(
      [incidencia.id, incidencia.codigo]
        .map((valor) => (valor === null || valor === undefined ? '' : String(valor).trim()))
        .filter((valor) => valor.length > 0),
    ),
  ];
}

export type BorradorIncidencia = Partial<Omit<Incidencia, 'id' | 'latitud' | 'longitud'>> & {
  latitud?: number | null;
  longitud?: number | null;
};

export type NuevaIncidencia = Omit<Incidencia, 'id' | 'latitud' | 'longitud'> &
  Partial<Pick<Incidencia, 'latitud' | 'longitud'>>;
