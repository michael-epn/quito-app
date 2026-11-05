import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  cameraOutline,
  cloudyOutline,
  documentTextOutline,
  locateOutline,
  navigateOutline,
  rainyOutline,
} from 'ionicons/icons';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  from,
  map,
  of,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';

import type {
  EstadoIncidencia,
  NuevaIncidencia,
  PrioridadIncidencia,
  TipoIncidencia,
} from '../models/incidencia.model';
import { CloudinaryService } from '../services/cloudinary.service';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';
import { WeatherService } from '../services/weather.service';
import type { ClimaActual } from '../services/weather.service';

type CamposCoordenada = 'latitud' | 'longitud';

interface FormularioRegistro {
  tipo: FormControl<TipoIncidencia>;
  descripcion: FormControl<string>;
  direccion: FormControl<string>;
  sector: FormControl<string>;
  fecha: FormControl<string>;
  estado: FormControl<EstadoIncidencia>;
  prioridad: FormControl<PrioridadIncidencia>;
  fotografia: FormControl<string>;
  latitud: FormControl<number | null>;
  longitud: FormControl<number | null>;
  observacion: FormControl<string>;
}

@Component({
  selector: 'app-registro-incidencia',
  templateUrl: './registro-incidencia.page.html',
  styleUrls: ['./registro-incidencia.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonImg,
    IonSpinner,
    ReactiveFormsModule,
    TitleCasePipe,
  ],
})
export class RegistroIncidenciaPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly storageService = inject(StorageService);
  private readonly weatherService = inject(WeatherService);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  readonly tipos: TipoIncidencia[] = [
    'luminarias dañadas',
    'baches',
    'señalización deteriorada',
    'alcantarillas obstruidas',
    'daños en parques',
  ];
  readonly prioridades: PrioridadIncidencia[] = ['baja', 'media', 'alta'];
  readonly form: FormGroup<FormularioRegistro> = this.crearFormulario();
  guardando = false;
  consultandoGps = false;
  consultandoClima = false;
  error = '';
  mensajeGps = '';
  clima: ClimaActual | null = null;
  private borradorEvaluado = false;
  private ultimaConsultaClima = '';
  private solicitudClima = 0;

  constructor() {
    addIcons({
      alertCircleOutline,
      cameraOutline,
      cloudyOutline,
      documentTextOutline,
      locateOutline,
      navigateOutline,
      rainyOutline,
    });
    this.aplicarValidadoresDinamicos();
    this.escucharCambiosDelFormulario();
    this.escucharCoordenadas();
  }

  async ionViewWillEnter(): Promise<void> {
    if (this.borradorEvaluado) {
      return;
    }

    this.borradorEvaluado = true;
    try {
      const borrador = this.storageService.obtenerBorrador();
      if (borrador === null) {
        return;
      }

      const alert = await this.alertController.create({
        header: 'Borrador encontrado',
        message: 'Hay una incidencia sin terminar. ¿Quieres continuar con el registro?',
        buttons: [
          {
            text: 'Descartar',
            role: 'destructive',
            handler: () => this.storageService.limpiarBorrador(),
          },
          {
            text: 'Continuar',
            role: 'confirm',
            handler: () => {
              this.form.patchValue(borrador);
              this.form.markAsPristine();
              return true;
            },
          },
        ],
      });
      await alert.present();
    } catch (error) {
      console.error('No se pudo recuperar el borrador de la incidencia.', error);
      this.error = 'No se pudo recuperar el borrador guardado en este dispositivo.';
    }
  }

  async tomarFotografia(): Promise<void> {
    this.error = '';
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 45,
        width: 600,
      });
      if (!photo.dataUrl) {
        await this.mostrarErrorDeFotografia();
        return;
      }
      this.form.controls.fotografia.setValue(photo.dataUrl);
      this.form.controls.fotografia.markAsTouched();
    } catch (error) {
      if (this.esCancelacionDeCamara(error)) {
        return;
      }

      console.error('No se pudo capturar la fotografía de la incidencia.', error);
      if (this.form.controls.prioridad.value === 'alta') {
        await this.mostrarAlertaFotoObligatoria();
      } else {
        this.error = 'No se pudo acceder a la cámara. Puedes continuar sin fotografía.';
      }
    }
  }

  async obtenerUbicacion(): Promise<void> {
    this.consultandoGps = true;
    this.mensajeGps = '';
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      this.form.patchValue({
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
      });
      this.form.controls.latitud.markAsTouched();
      this.form.controls.longitud.markAsTouched();
      this.mensajeGps = 'Ubicación GPS obtenida.';
    } catch (error) {
      console.error('No se pudo obtener la ubicación GPS.', error);
      this.mensajeGps = 'No se pudo obtener el GPS. Ingresa las coordenadas manualmente.';
    } finally {
      this.consultandoGps = false;
    }
  }

  normalizarCoordenada(campo: CamposCoordenada, evento: CustomEvent<{ value?: string | null }>): void {
    const valor = evento.detail.value;
    this.form.controls[campo].setValue(valor === null || valor === undefined || valor === '' ? null : Number(valor));
  }

  async registrar(): Promise<void> {
    if (this.guardando) {
      return;
    }

    this.error = '';
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.error =
        this.form.controls.prioridad.value === 'alta' && this.form.controls.fotografia.invalid
          ? 'La fotografía es obligatoria para las incidencias de prioridad alta.'
          : 'Revisa los campos obligatorios y sus valores.';
      return;
    }

    const coordenadas = this.coordenadasValidas();
    if (coordenadas) {
      await this.consultarClima(coordenadas.latitud, coordenadas.longitud);
    }

    const { latitud: _latitud, longitud: _longitud, ...valores } = this.form.getRawValue();
    const incidencia: NuevaIncidencia = {
      ...valores,
      descripcion: valores.descripcion.trim(),
      direccion: valores.direccion.trim(),
      sector: valores.sector.trim(),
      observacion: valores.observacion.trim(),
      ...(coordenadas ?? {}),
      fecha: this.fechaActual(),
      estado: 'pendiente',
    };

    let falloSubidaFotografia = false;
    const fotografia = incidencia.fotografia;
    const incidenciaConFotografia$ =
      fotografia && !this.esUrlCloudinary(fotografia)
        ? this.cloudinaryService.subirImagen(fotografia).pipe(
            map((secureUrl) => {
              this.form.controls.fotografia.setValue(secureUrl, { emitEvent: false });
              try {
                this.storageService.guardarBorrador(this.form.getRawValue());
              } catch (error) {
                console.error('No se pudo actualizar el borrador con la URL de Cloudinary.', error);
              }
              return { ...incidencia, fotografia: secureUrl };
            }),
            catchError((error: unknown) => {
              falloSubidaFotografia = true;
              if (incidencia.prioridad === 'alta') {
                return throwError(() => error);
              }

              return from(this.confirmarGuardarSinFotografia()).pipe(
                switchMap((confirmado) =>
                  confirmado
                    ? of({ ...incidencia, fotografia: '' })
                    : throwError(() => new Error('Se canceló el registro sin la fotografía opcional.')),
                ),
              );
            }),
          )
        : of(incidencia);

    this.guardando = true;
    incidenciaConFotografia$
      .pipe(
        switchMap((incidenciaLista) => this.incidenciasService.crearIncidencia(incidenciaLista)),
        finalize(() => {
          this.guardando = false;
        }),
      )
      .subscribe({
        next: () => {
          try {
            this.storageService.limpiarBorrador();
          } catch (error) {
            console.error('La incidencia se registró, pero no se pudo limpiar el borrador local.', error);
          }
          void this.router.navigate(['/incidencias']);
        },
        error: () => {
          this.error = falloSubidaFotografia
            ? incidencia.prioridad === 'alta'
              ? 'No se pudo subir la fotografía obligatoria. La incidencia no se guardó; inténtalo nuevamente.'
              : 'No se registró la incidencia. Puedes volver a intentarlo con la fotografía o sin ella.'
            : 'No se pudo registrar la incidencia. El borrador se conserva en este dispositivo.';
        },
      });
  }

  private crearFormulario(): FormGroup<FormularioRegistro> {
    return this.formBuilder.group<FormularioRegistro>({
      tipo: this.formBuilder.nonNullable.control<TipoIncidencia>('baches', Validators.required),
      descripcion: this.formBuilder.nonNullable.control('', Validators.required),
      direccion: this.formBuilder.nonNullable.control('', Validators.required),
      sector: this.formBuilder.nonNullable.control('', Validators.required),
      fecha: this.formBuilder.nonNullable.control(this.fechaActual()),
      estado: this.formBuilder.nonNullable.control<EstadoIncidencia>('pendiente'),
      prioridad: this.formBuilder.nonNullable.control<PrioridadIncidencia>('media', Validators.required),
      fotografia: this.formBuilder.nonNullable.control(''),
      latitud: new FormControl<number | null>(null),
      longitud: new FormControl<number | null>(null),
      observacion: this.formBuilder.nonNullable.control(''),
    });
  }

  private fechaActual(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
  }

  private esUrlCloudinary(fotografia: string): boolean {
    return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(fotografia);
  }

  private async confirmarGuardarSinFotografia(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'No se pudo subir la fotografía',
      message: 'La evidencia es opcional para esta prioridad. ¿Quieres guardar la incidencia sin fotografía?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar sin fotografía', role: 'confirm' },
      ],
    });
    await alert.present();
    const resultado = await alert.onDidDismiss();
    return resultado.role === 'confirm';
  }

  private aplicarValidadoresDinamicos(): void {
    const foto = this.form.controls.fotografia;
    foto.setValidators(this.form.controls.prioridad.value === 'alta' ? Validators.required : null);
    foto.updateValueAndValidity({ emitEvent: false });

    const validadoresCoordenadas =
      this.form.controls.tipo.value === 'baches'
        ? {
            latitud: [Validators.required, Validators.min(-90), Validators.max(90)],
            longitud: [Validators.required, Validators.min(-180), Validators.max(180)],
          }
        : { latitud: [], longitud: [] };

    this.form.controls.latitud.setValidators(validadoresCoordenadas.latitud);
    this.form.controls.longitud.setValidators(validadoresCoordenadas.longitud);
    this.form.controls.latitud.updateValueAndValidity({ emitEvent: false });
    this.form.controls.longitud.updateValueAndValidity({ emitEvent: false });
  }

  private escucharCambiosDelFormulario(): void {
    this.form.controls.prioridad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarValidadoresDinamicos());
    this.form.controls.tipo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarValidadoresDinamicos());

    this.form.valueChanges.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe((borrador) => {
      try {
        this.storageService.guardarBorrador(borrador);
      } catch (error) {
        console.error('No se pudo guardar automáticamente el borrador.', error);
        this.error = 'No se pudo guardar el borrador en este dispositivo.';
      }
    });
  }

  private escucharCoordenadas(): void {
    combineLatest([
      this.form.controls.latitud.valueChanges.pipe(startWith(this.form.controls.latitud.value)),
      this.form.controls.longitud.valueChanges.pipe(startWith(this.form.controls.longitud.value)),
    ])
      .pipe(
        debounceTime(500),
        distinctUntilChanged(
          ([latitudAnterior, longitudAnterior], [latitudActual, longitudActual]) =>
            latitudAnterior === latitudActual && longitudAnterior === longitudActual,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([latitud, longitud]) => {
        if (this.esCoordenadaValida(latitud, -90, 90) && this.esCoordenadaValida(longitud, -180, 180)) {
          void this.consultarClima(latitud, longitud);
        } else {
          this.solicitudClima += 1;
          this.ultimaConsultaClima = '';
          this.clima = null;
          this.consultandoClima = false;
        }
      });
  }

  private async consultarClima(latitud: number, longitud: number): Promise<void> {
    const clave = `${latitud},${longitud}`;
    if (this.ultimaConsultaClima === clave && this.clima !== null && !this.clima.error) {
      return;
    }

    this.consultandoClima = true;
    this.clima = null;
    this.ultimaConsultaClima = clave;
    const solicitud = ++this.solicitudClima;
    try {
      const clima = await firstValueFrom(this.weatherService.obtenerClimaActual(latitud, longitud));
      if (solicitud === this.solicitudClima) {
        this.clima = clima;
      }
    } catch (error) {
      console.error('No se pudo consultar el clima para las coordenadas de la incidencia.', error);
      if (solicitud === this.solicitudClima) {
        this.clima = {
          temperatura: null,
          precipitacion: null,
          descripcion: 'No se pudo consultar el clima',
          alertaLluvia: false,
          error: true,
          mensajeError: 'El servicio meteorológico no está disponible. Puedes continuar con el registro.',
        };
      }
    } finally {
      if (solicitud === this.solicitudClima) {
        this.consultandoClima = false;
      }
    }
  }

  private coordenadasValidas(): { latitud: number; longitud: number } | null {
    const { latitud, longitud } = this.form.getRawValue();
    if (this.esCoordenadaValida(latitud, -90, 90) && this.esCoordenadaValida(longitud, -180, 180)) {
      return { latitud, longitud };
    }
    return null;
  }

  private esCoordenadaValida(valor: number | null, minimo: number, maximo: number): valor is number {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= minimo && valor <= maximo;
  }

  private esCancelacionDeCamara(error: unknown): boolean {
    const mensaje =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : '';
    return /cancel(?:led|ed)?/i.test(mensaje);
  }

  private async mostrarErrorDeFotografia(): Promise<void> {
    if (this.form.controls.prioridad.value === 'alta') {
      await this.mostrarAlertaFotoObligatoria();
    } else {
      this.error = 'No se obtuvo una fotografía. Puedes volver a intentarlo.';
    }
  }

  private async mostrarAlertaFotoObligatoria(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Fotografía obligatoria',
      message:
        'La foto es obligatoria para una incidencia de prioridad alta. Revisa los permisos de cámara e inténtalo de nuevo.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }
}
