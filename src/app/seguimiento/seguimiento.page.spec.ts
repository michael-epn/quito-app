import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import type { Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

import { SeguimientoPage } from './seguimiento.page';

const registros: Incidencia[] = [
  {
    id: '1',
    codigo: 'INC-001',
    tipo: 'baches',
    descripcion: 'Bache marcado.',
    direccion: 'Av. Amazonas',
    sector: 'Iñaquito',
    fecha: '2026-10-28',
    estado: 'pendiente',
    prioridad: 'media',
    fotografia: '',
    latitud: -0.18,
    longitud: -78.48,
    observacion: '',
  },
  {
    id: 'INC-002',
    tipo: 'luminarias dañadas',
    descripcion: 'Luminaria sin marcar.',
    direccion: 'Av. 6 de Diciembre',
    sector: 'La Mariscal',
    fecha: '2026-10-27',
    estado: 'en proceso',
    prioridad: 'baja',
    fotografia: '',
    latitud: -0.2,
    longitud: -78.49,
    observacion: '',
  },
];

describe('SeguimientoPage', () => {
  let eliminarCodigoSeguimiento: ReturnType<typeof vi.fn>;
  let obtenerCodigosSeguimiento: ReturnType<typeof vi.fn>;
  let obtenerTodasLasIncidencias: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obtenerCodigosSeguimiento = vi.fn(() => ['INC-001']);
    eliminarCodigoSeguimiento = vi.fn();
    obtenerTodasLasIncidencias = vi.fn(() => of(registros));

    await TestBed.configureTestingModule({
      imports: [SeguimientoPage],
      providers: [
        provideRouter([]),
        {
          provide: IncidenciasService,
          useValue: { obtenerTodasLasIncidencias },
        },
        {
          provide: StorageService,
          useValue: { obtenerCodigosSeguimiento, eliminarCodigoSeguimiento },
        },
      ],
    }).compileComponents();
  });

  it('loads only locally tracked incidences and removes them immediately when unmarked', () => {
    const fixture = TestBed.createComponent(SeguimientoPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    expect(obtenerCodigosSeguimiento).toHaveBeenCalledOnce();
    expect(obtenerTodasLasIncidencias).toHaveBeenCalledOnce();
    expect(page.incidencias()).toEqual([registros[0]]);
    expect(fixture.nativeElement.textContent).toContain('Bache marcado.');
    expect(fixture.nativeElement.textContent).not.toContain('Luminaria sin marcar.');

    page.desmarcar(registros[0]);
    fixture.detectChanges();
    expect(eliminarCodigoSeguimiento).toHaveBeenCalledWith('INC-001');
    expect(eliminarCodigoSeguimiento).toHaveBeenCalledWith('1');
    expect(page.incidencias()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Aún no has marcado incidencias');
    expect(obtenerTodasLasIncidencias).toHaveBeenCalledOnce();
  });
});
