import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import type { NuevaIncidencia } from '../models/incidencia.model';
import { CloudinaryService } from '../services/cloudinary.service';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';
import { WeatherService } from '../services/weather.service';

import { RegistroIncidenciaPage } from './registro-incidencia.page';

describe('RegistroIncidenciaPage', () => {
  let crearIncidencia: ReturnType<typeof vi.fn>;
  let subirImagen: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    crearIncidencia = vi.fn((_incidencia: NuevaIncidencia) => of({ id: 'INC-TEST' }));
    subirImagen = vi.fn((_imagen: string) => of('https://res.cloudinary.com/test/image/upload/evidencia.jpg'));

    await TestBed.configureTestingModule({
      imports: [RegistroIncidenciaPage],
      providers: [
        provideRouter([{ path: 'incidencias', children: [] }]),
        {
          provide: IncidenciasService,
          useValue: { crearIncidencia },
        },
        {
          provide: CloudinaryService,
          useValue: { subirImagen },
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
        {
          provide: AlertController,
          useValue: {
            create: () =>
              Promise.resolve({
                present: () => undefined,
                onDidDismiss: () => Promise.resolve({ role: 'confirm' }),
              }),
          },
        },
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

  it('uploads the photo before creating the incidence with its public URL', async () => {
    const fixture = TestBed.createComponent(RegistroIncidenciaPage);
    const page = fixture.componentInstance;
    page.form.patchValue({
      tipo: 'luminarias dañadas',
      descripcion: 'Luminaria apagada.',
      direccion: 'Av. Amazonas',
      sector: 'Iñaquito',
      prioridad: 'alta',
      fotografia: 'data:image/jpeg;base64,abc',
    });

    await page.registrar();

    expect(subirImagen).toHaveBeenCalledWith('data:image/jpeg;base64,abc');
    expect(crearIncidencia).toHaveBeenCalledOnce();
    expect(subirImagen.mock.invocationCallOrder[0]).toBeLessThan(crearIncidencia.mock.invocationCallOrder[0]);
    expect(crearIncidencia.mock.calls[0][0].fotografia).toBe(
      'https://res.cloudinary.com/test/image/upload/evidencia.jpg',
    );
    expect(page.form.controls.fotografia.value).toBe('https://res.cloudinary.com/test/image/upload/evidencia.jpg');
  });

  it('does not create a high-priority incidence when photo upload fails', async () => {
    subirImagen.mockReturnValue(throwError(() => new Error('Upload failed')));
    const fixture = TestBed.createComponent(RegistroIncidenciaPage);
    const page = fixture.componentInstance;
    page.form.patchValue({
      tipo: 'luminarias dañadas',
      descripcion: 'Luminaria apagada.',
      direccion: 'Av. Amazonas',
      sector: 'Iñaquito',
      prioridad: 'alta',
      fotografia: 'data:image/jpeg;base64,abc',
    });

    await page.registrar();

    expect(crearIncidencia).not.toHaveBeenCalled();
    expect(page.error).toContain('fotografía obligatoria');
    expect(page.guardando).toBe(false);
  });

  it('lets the user save an optional-photo incidence without the photo after upload failure', async () => {
    subirImagen.mockReturnValue(throwError(() => new Error('Upload failed')));
    const fixture = TestBed.createComponent(RegistroIncidenciaPage);
    const page = fixture.componentInstance;
    page.form.patchValue({
      tipo: 'luminarias dañadas',
      descripcion: 'Luminaria apagada.',
      direccion: 'Av. Amazonas',
      sector: 'Iñaquito',
      prioridad: 'media',
      fotografia: 'data:image/jpeg;base64,abc',
    });

    await page.registrar();
    await vi.waitFor(() => expect(crearIncidencia).toHaveBeenCalledOnce());

    expect(crearIncidencia.mock.calls[0][0].fotografia).toBe('');
  });
});
