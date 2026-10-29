import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { of } from 'rxjs';

import type { Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

import { DetalleIncidenciaPage } from './detalle-incidencia.page';

const incidenciaPendiente: Incidencia = {
  id: 'INC-TEST',
  tipo: 'baches',
  descripcion: 'Bache junto al cruce.',
  direccion: 'Av. Amazonas',
  sector: 'Iñaquito',
  fecha: '2026-10-28',
  estado: 'pendiente',
  prioridad: 'media',
  fotografia: '',
  latitud: -0.18,
  longitud: -78.48,
  observacion: '',
};

describe('DetalleIncidenciaPage', () => {
  let incidenciaActual: Incidencia;

  beforeEach(async () => {
    incidenciaActual = { ...incidenciaPendiente };
    await TestBed.configureTestingModule({
      imports: [DetalleIncidenciaPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: incidenciaPendiente.id })) },
        },
        {
          provide: IncidenciasService,
          useValue: {
            obtenerIncidenciaPorId: () => of(incidenciaActual),
            reemplazarIncidencia: (_id: string, incidencia: Incidencia) => of(incidencia),
          },
        },
        {
          provide: StorageService,
          useValue: {
            estaEnSeguimiento: () => false,
            guardarCodigoSeguimiento: () => undefined,
            eliminarCodigoSeguimiento: () => undefined,
          },
        },
        {
          provide: AlertController,
          useValue: {
            create: () =>
              Promise.resolve({
                present: () => Promise.resolve(),
                onDidDismiss: () => Promise.resolve({ role: 'cancel' }),
              }),
          },
        },
        {
          provide: ToastController,
          useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) },
        },
      ],
    }).compileComponents();
  });

  it('only offers allowed state transitions and requires a non-blank resolution observation', () => {
    const fixture = TestBed.createComponent(DetalleIncidenciaPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();

    expect(page.estadosPermitidos()).toEqual(['en proceso', 'resuelta']);
    page.cambiarEstadoSeleccionado('resuelta');
    expect(page.form.controls.observacion.hasError('required')).toBe(true);

    page.form.controls.observacion.setValue('   ');
    expect(page.form.controls.observacion.hasError('pattern')).toBe(true);

    page.form.controls.observacion.setValue('Reparación completada.');
    expect(page.form.controls.observacion.valid).toBe(true);

    incidenciaActual = { ...incidenciaPendiente, estado: 'en proceso' };
    page.cargar(incidenciaActual.id);
    expect(page.estadosPermitidos()).toEqual(['resuelta']);

    incidenciaActual = { ...incidenciaPendiente, estado: 'resuelta', observacion: 'Reparada.' };
    page.cargar(incidenciaActual.id);
    expect(page.estadosPermitidos()).toEqual([]);
  });
});
