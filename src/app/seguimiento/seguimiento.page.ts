import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { forkJoin } from 'rxjs';

import type { EstadoIncidencia, Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.page.html',
  styleUrls: ['./seguimiento.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonBadge,
    IonButton,
    IonSpinner,
    DatePipe,
    TitleCasePipe,
  ],
})
export class SeguimientoPage {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);

  incidencias: Incidencia[] = [];
  cargando = false;
  error = false;

  ionViewWillEnter(): void {
    this.cargarSeguimiento();
  }

  cargarSeguimiento(): void {
    let codigos: string[];
    try {
      codigos = this.storageService.obtenerCodigosSeguimiento();
    } catch (error) {
      console.error('No se pudieron leer los códigos guardados para seguimiento.', error);
      this.error = true;
      this.incidencias = [];
      return;
    }

    this.incidencias = [];
    this.error = false;
    if (codigos.length === 0) {
      this.cargando = false;
      return;
    }

    this.cargando = true;
    forkJoin(codigos.map((codigo) => this.incidenciasService.obtenerIncidenciaPorId(codigo))).subscribe({
      next: (incidencias) => {
        this.incidencias = incidencias;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
  }

  desmarcar(incidencia: Incidencia): void {
    this.storageService.eliminarCodigoSeguimiento(incidencia.id);
    this.incidencias = this.incidencias.filter((actual) => actual.id !== incidencia.id);
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
}
