import { TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, alertCircleOutline, checkmarkCircleOutline, constructOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

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
    IonIcon,
    IonProgressBar,
    IonSpinner,
    IonButton,
    RouterLink,
    TitleCasePipe,
  ],
})
export class HomePage implements OnInit {
  private readonly incidenciasService = inject(IncidenciasService);
  private primeraEntrada = true;
  private readonly cargaEnCurso = signal(false);

  readonly estados: EstadoIncidencia[] = ['pendiente', 'en proceso', 'resuelta'];
  readonly totales = signal<Record<EstadoIncidencia, number>>({
    pendiente: 0,
    'en proceso': 0,
    resuelta: 0,
  });
  readonly cargando = signal(false);
  readonly error = signal(false);

  constructor() {
    addIcons({ addOutline, alertCircleOutline, checkmarkCircleOutline, constructOutline });
  }

  ngOnInit(): void {
    this.cargarIndicadores();
  }

  ionViewWillEnter(): void {
    if (this.primeraEntrada) {
      this.primeraEntrada = false;
      return;
    }

    this.cargarIndicadores();
  }

  reintentar(): void {
    this.cargarIndicadores();
  }

  porcentaje(estado: EstadoIncidencia): number {
    const total = this.totalIncidencias();
    return total === 0 ? 0 : Math.round((this.totales()[estado] / total) * 100);
  }

  totalIncidencias(): number {
    return Object.values(this.totales()).reduce((total, cantidad) => total + cantidad, 0);
  }

  iconoEstado(estado: EstadoIncidencia): string {
    switch (estado) {
      case 'pendiente':
        return 'alert-circle-outline';
      case 'en proceso':
        return 'construct-outline';
      case 'resuelta':
        return 'checkmark-circle-outline';
    }
  }

  private cargarIndicadores(): void {
    if (this.cargaEnCurso()) {
      return;
    }

    this.cargando.set(true);
    this.cargaEnCurso.set(true);
    this.error.set(false);

    this.incidenciasService
      .obtenerTodasLasIncidencias()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
          this.cargaEnCurso.set(false);
        }),
      )
      .subscribe({
        next: (incidencias) => this.actualizarTotales(incidencias),
        error: () => this.error.set(true),
      });
  }

  private actualizarTotales(incidencias: Incidencia[]): void {
    this.totales.set({
      pendiente: incidencias.filter((incidencia) => incidencia.estado === 'pendiente').length,
      'en proceso': incidencias.filter((incidencia) => incidencia.estado === 'en proceso').length,
      resuelta: incidencias.filter((incidencia) => incidencia.estado === 'resuelta').length,
    });
  }
}
