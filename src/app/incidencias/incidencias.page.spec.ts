import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import type { Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

import { IncidenciasPage } from './incidencias.page';

const registros: Incidencia[] = [
  {
    id: '1',
    codigo: 'INC-001',
    tipo: 'baches',
    descripcion: 'Bache en la calzada.',
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
];

describe('IncidenciasPage', () => {
  let obtenerIncidencias: ReturnType<typeof vi.fn>;
  let guardarCodigoSeguimiento: ReturnType<typeof vi.fn>;
  let eliminarCodigoSeguimiento: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obtenerIncidencias = vi.fn(() => of(registros));
    guardarCodigoSeguimiento = vi.fn();
    eliminarCodigoSeguimiento = vi.fn();

    await TestBed.configureTestingModule({
      imports: [IncidenciasPage],
      providers: [
        provideRouter([]),
        {
          provide: IncidenciasService,
          useValue: { obtenerIncidencias },
        },
        {
          provide: StorageService,
          useValue: {
            obtenerCodigosSeguimiento: () => [],
            guardarCodigoSeguimiento,
            eliminarCodigoSeguimiento,
          },
        },
      ],
    }).compileComponents();
  });

  it('loads the first page on initialization and renders the incidence', () => {
    const fixture = TestBed.createComponent(IncidenciasPage);
    fixture.detectChanges();

    expect(obtenerIncidencias).toHaveBeenCalledWith(1, 8);
    expect(fixture.componentInstance.incidencias()).toEqual(registros);
    expect(fixture.nativeElement.textContent).toContain('INC-001');
    expect(fixture.nativeElement.textContent).toContain('Av. Amazonas');
  });

  it('marks and unmarks an incidence using local storage only', () => {
    const fixture = TestBed.createComponent(IncidenciasPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    page.alternarSeguimiento(registros[0]);
    expect(guardarCodigoSeguimiento).toHaveBeenCalledWith('1');
    expect(guardarCodigoSeguimiento).toHaveBeenCalledWith('INC-001');
    expect(page.estaEnSeguimiento(registros[0])).toBe(true);

    page.alternarSeguimiento(registros[0]);
    expect(eliminarCodigoSeguimiento).toHaveBeenCalledWith('1');
    expect(eliminarCodigoSeguimiento).toHaveBeenCalledWith('INC-001');
    expect(page.estaEnSeguimiento(registros[0])).toBe(false);
    expect(obtenerIncidencias).toHaveBeenCalledTimes(1);
  });
});
