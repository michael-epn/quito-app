import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { of } from 'rxjs';

import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';
import { WeatherService } from '../services/weather.service';

import { RegistroIncidenciaPage } from './registro-incidencia.page';

describe('RegistroIncidenciaPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroIncidenciaPage],
      providers: [
        provideRouter([]),
        {
          provide: IncidenciasService,
          useValue: { crearIncidencia: () => of({ id: 'INC-TEST' }) },
        },
        {
          provide: StorageService,
          useValue: {
            obtenerBorrador: () => null,
            guardarBorrador: () => undefined,
            limpiarBorrador: () => undefined,
          },
        },
        {
          provide: WeatherService,
          useValue: {
            obtenerClimaActual: () =>
              of({
                temperatura: 18,
                precipitacion: 0,
                descripcion: 'Despejado',
                alertaLluvia: false,
                error: false,
              }),
          },
        },
        { provide: AlertController, useValue: { create: () => Promise.resolve({ present: () => undefined }) } },
      ],
    }).compileComponents();
  });

  it('requires a photo only for high priority', () => {
    const fixture = TestBed.createComponent(RegistroIncidenciaPage);
    const page = fixture.componentInstance;

    page.form.controls.prioridad.setValue('alta');
    expect(page.form.controls.fotografia.hasError('required')).toBe(true);

    page.form.controls.fotografia.setValue('data:image/jpeg;base64,abc');
    expect(page.form.controls.fotografia.valid).toBe(true);

    page.form.controls.prioridad.setValue('media');
    page.form.controls.fotografia.setValue('');
    expect(page.form.controls.fotografia.valid).toBe(true);
  });

  it('requires bounded coordinates only for pothole reports', () => {
    const fixture = TestBed.createComponent(RegistroIncidenciaPage);
    const page = fixture.componentInstance;

    expect(page.form.controls.latitud.hasError('required')).toBe(true);
    page.form.controls.latitud.setValue(91);
    expect(page.form.controls.latitud.hasError('max')).toBe(true);

    page.form.controls.tipo.setValue('luminarias dañadas');
    page.form.controls.latitud.setValue(null);
    expect(page.form.controls.latitud.valid).toBe(true);
  });
});
