import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

import type { EstadoIncidencia, Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSpinner,
    IonButton,
    RouterLink,
    TitleCasePipe,
  ],
})
export class HomePage {
  private readonly incidenciasService = inject(IncidenciasService);
  readonly estados: EstadoIncidencia[] = ['pendiente', 'en proceso', 'resuelta'];
  readonly totales: Record<EstadoIncidencia, number> = {
    pendiente: 0,
    'en proceso': 0,
    resuelta: 0,
  };
  cargando = false;
  error = false;

  constructor() {
    addIcons({ addOutline });
  }

  ionViewWillEnter(): void {
    this.cargando = true;
    this.error = false;
    this.incidenciasService.obtenerTodasLasIncidencias().subscribe({
      next: (incidencias) => {
        this.actualizarTotales(incidencias);
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
  }

  private actualizarTotales(incidencias: Incidencia[]): void {
    this.totales.pendiente = incidencias.filter((incidencia) => incidencia.estado === 'pendiente').length;
    this.totales['en proceso'] = incidencias.filter((incidencia) => incidencia.estado === 'en proceso').length;
    this.totales.resuelta = incidencias.filter((incidencia) => incidencia.estado === 'resuelta').length;
  }
}
