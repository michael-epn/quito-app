import { DatePipe, TitleCasePipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { identificadoresIncidencia } from '../models/incidencia.model';
import type { EstadoIncidencia, Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

const OBSERVACION_REQUERIDA = Validators.pattern(/.*\S.*/);

@Component({
  selector: 'app-detalle-incidencia',
  templateUrl: './detalle-incidencia.page.html',
  styleUrls: ['./detalle-incidencia.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonBadge,
    IonImg,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonIcon,
    IonSpinner,
    IonButton,
    RouterLink,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
  ],
})
export class DetalleIncidenciaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  incidencia: Incidencia | null = null;
  readonly form = this.formBuilder.group({
    estado: this.formBuilder.nonNullable.control<EstadoIncidencia>('pendiente', Validators.required),
    observacion: this.formBuilder.nonNullable.control(''),
  });
  readonly cargando = signal(true);
  readonly error = signal(false);
  guardando = false;
  mensajeToast = '';
  seguimiento = false;
  mensajeError = '';

  constructor() {
    addIcons({ bookmark, bookmarkOutline });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      const id = parametros.get('id');
      console.log('Identificador de incidencia recibido en la ruta:', id);
      if (id === null) {
        this.cargando.set(false);
        this.error.set(true);
        return;
      }
      this.cargar(id);
    });
  }

  cargar(id: string): void {
    this.cargando.set(true);
    this.error.set(false);
    this.mensajeError = '';
    this.incidenciasService
      .obtenerIncidenciaPorId(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (incidencia) => {
          this.incidencia = incidencia;
          this.form.reset({
            estado: incidencia.estado,
            observacion: incidencia.observacion ?? '',
          });
          this.actualizarValidadorObservacion(incidencia.estado);
          this.sincronizarSeguimiento();
        },
        error: () => {
          this.error.set(true);
        },
      });
  }

  estadosPermitidos(): EstadoIncidencia[] {
    switch (this.incidencia?.estado) {
      case 'pendiente':
        return ['en proceso', 'resuelta'];
      case 'en proceso':
        return ['resuelta'];
      case 'resuelta':
      case undefined:
        return [];
    }
  }

  cambiarEstadoSeleccionado(estado: EstadoIncidencia): void {
    if (!this.estadosPermitidos().includes(estado)) {
      this.form.controls.estado.setValue(this.incidencia?.estado ?? 'pendiente');
      return;
    }
    this.form.controls.estado.setValue(estado);
    this.actualizarValidadorObservacion(estado);
  }

  async confirmarCambioEstado(): Promise<void> {
    if (this.incidencia === null || this.estadosPermitidos().length === 0 || this.guardando) {
      return;
    }

    const estado = this.form.controls.estado.value;
    if (!this.estadosPermitidos().includes(estado)) {
      this.mensajeError = 'La transición seleccionada no está permitida.';
      return;
    }

    this.actualizarValidadorObservacion(estado);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.mensajeError = 'Escribe una observación que explique la resolución antes de continuar.';
      return;
    }

    const confirmado = await this.confirmarActualizacion(estado);
    if (!confirmado) {
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    const actualizada: Incidencia = {
      ...this.incidencia,
      estado,
      observacion: this.form.controls.observacion.value.trim(),
    };

    this.incidenciasService.reemplazarIncidencia(String(this.incidencia.id), actualizada).subscribe({
      next: (resultado) => {
        this.incidencia = resultado;
        this.form.reset({ estado: resultado.estado, observacion: resultado.observacion ?? '' });
        this.actualizarValidadorObservacion(resultado.estado);
        this.guardando = false;
        this.mensajeToast = `Incidencia actualizada a "${resultado.estado}".`;
        void this.mostrarToast();
      },
      error: () => {
        this.guardando = false;
        this.mensajeError = 'No se pudo actualizar la incidencia. Inténtalo nuevamente.';
      },
    });
  }

  alternarSeguimiento(): void {
    if (this.incidencia === null) {
      return;
    }

    try {
      const identificadores = identificadoresIncidencia(this.incidencia);
      if (this.seguimiento) {
        identificadores.forEach((identificador) => this.storageService.eliminarCodigoSeguimiento(identificador));
        this.seguimiento = false;
        return;
      }

      identificadores.forEach((identificador) => this.storageService.guardarCodigoSeguimiento(identificador));
      this.seguimiento = true;
    } catch (error) {
      console.error('No se pudo actualizar el seguimiento local de la incidencia.', error);
      this.mensajeError = 'No se pudo guardar el cambio de seguimiento en este dispositivo.';
    }
  }

  coordenadasDisponibles(): boolean {
    return (
      this.incidencia !== null && Number.isFinite(this.incidencia.latitud) && Number.isFinite(this.incidencia.longitud)
    );
  }

  colorEstado(estado: EstadoIncidencia): string {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'en proceso':
        return 'primary';
      case 'resuelta':
        return 'success';
    }
  }

  private actualizarValidadorObservacion(estado: EstadoIncidencia): void {
    const observacion = this.form.controls.observacion;
    if (estado === 'resuelta') {
      observacion.setValidators([Validators.required, OBSERVACION_REQUERIDA]);
    } else {
      observacion.clearValidators();
    }
    observacion.updateValueAndValidity({ emitEvent: false });
  }

  private sincronizarSeguimiento(): void {
    if (this.incidencia === null) {
      this.seguimiento = false;
      return;
    }

    try {
      this.seguimiento = identificadoresIncidencia(this.incidencia).some((identificador) =>
        this.storageService.estaEnSeguimiento(identificador),
      );
    } catch (error) {
      console.error('No se pudo consultar el seguimiento local de la incidencia.', error);
      this.mensajeError = 'No se pudo consultar el seguimiento guardado en este dispositivo.';
    }
  }

  private async confirmarActualizacion(estado: EstadoIncidencia): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Confirmar cambio de estado',
      message: `¿Quieres cambiar el estado de "${this.incidencia?.estado}" a "${estado}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', role: 'confirm' },
      ],
    });
    await alert.present();
    const resultado = await alert.onDidDismiss();
    return resultado.role === 'confirm';
  }

  private async mostrarToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.mensajeToast,
      duration: 2500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }
}
