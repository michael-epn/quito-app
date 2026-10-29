import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import type { Incidencia, PrioridadIncidencia, TipoIncidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

type DatosIncidencia = Omit<Incidencia, 'id'>;

@Component({
  selector: 'app-nueva-incidencia',
  templateUrl: './nueva-incidencia.page.html',
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
    FormsModule,
    TitleCasePipe,
  ],
})
export class NuevaIncidenciaPage {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  readonly tipos: TipoIncidencia[] = [
    'luminarias dañadas',
    'baches',
    'señalización deteriorada',
    'alcantarillas obstruidas',
    'daños en parques',
  ];
  readonly prioridades: PrioridadIncidencia[] = ['baja', 'media', 'alta'];
  formulario: DatosIncidencia = this.nuevoFormulario();
  guardando = false;
  error = '';

  ionViewWillEnter(): void {
    try {
      const borrador = this.storageService.obtenerBorrador();
      if (borrador !== null) {
        this.formulario = { ...this.nuevoFormulario(), ...borrador };
      }
      this.error = '';
    } catch (error) {
      console.error('No se pudo recuperar el borrador de la incidencia.', error);
      this.error = 'No se pudo recuperar el borrador guardado.';
    }
  }

  guardarBorrador(): void {
    try {
      this.storageService.guardarBorrador(this.formulario);
    } catch (error) {
      console.error('No se pudo guardar el borrador de la incidencia.', error);
      this.error = 'No se pudo guardar el borrador en este dispositivo.';
    }
  }

  registrar(): void {
    this.guardarBorrador();
    this.guardando = true;
    this.error = '';
    this.incidenciasService.crearIncidencia(this.formulario).subscribe({
      next: (incidencia) => {
        this.storageService.limpiarBorrador();
        void this.router.navigate(['/incidencia', incidencia.id]);
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo registrar la incidencia. El borrador se conserva en este dispositivo.';
      },
    });
  }

  private nuevoFormulario(): DatosIncidencia {
    return {
      tipo: 'baches',
      descripcion: '',
      direccion: '',
      sector: '',
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      prioridad: 'media',
      fotografia: '',
      latitud: -0.1807,
      longitud: -78.4678,
      observacion: '',
    };
  }
}
