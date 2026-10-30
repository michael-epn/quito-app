import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonChip,
  IonLabel,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bookmark,
  bookmarkOutline,
  calendarOutline,
  clipboardOutline,
  constructOutline,
  flashOutline,
  leafOutline,
  locationOutline,
  mapOutline,
  pricetagOutline,
  waterOutline,
} from 'ionicons/icons';
import { finalize } from 'rxjs';

import { identificadoresIncidencia } from '../models/incidencia.model';
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
    IonChip,
    IonIcon,
    IonLabel,
    IonSkeletonText,
    RouterLink,
    DatePipe,
    TitleCasePipe,
  ],
})
export class SeguimientoPage implements OnInit {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);
  private primeraEntrada = true;
  private readonly cargaEnCurso = signal(false);

  readonly incidencias = signal<Incidencia[]>([]);
  readonly cargando = signal(false);
  readonly error = signal(false);
  readonly mensajeError = signal('');

  constructor() {
    addIcons({
      alertCircleOutline,
      bookmark,
      bookmarkOutline,
      calendarOutline,
      clipboardOutline,
      constructOutline,
      flashOutline,
      leafOutline,
      locationOutline,
      mapOutline,
      pricetagOutline,
      waterOutline,
    });
  }

  ngOnInit(): void {
    this.cargarSeguimiento();
  }

  ionViewWillEnter(): void {
    if (this.primeraEntrada) {
      this.primeraEntrada = false;
      return;
    }

    this.cargarSeguimiento();
  }

  cargarSeguimiento(): void {
    if (this.cargaEnCurso()) {
      return;
    }

    let codigos: string[];
    try {
      codigos = this.storageService.obtenerCodigosSeguimiento();
    } catch (error) {
      console.error('No se pudieron leer los códigos guardados para seguimiento.', error);
      this.incidencias.set([]);
      this.error.set(true);
      this.mensajeError.set('No se pudieron leer los marcadores guardados en este dispositivo.');
      return;
    }

    this.error.set(false);
    this.mensajeError.set('');
    this.incidencias.set([]);
    if (codigos.length === 0) {
      this.cargando.set(false);
      return;
    }

    this.cargaEnCurso.set(true);
    this.cargando.set(true);
    this.incidenciasService
      .obtenerTodasLasIncidencias()
      .pipe(
        finalize(() => {
          this.cargaEnCurso.set(false);
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (todas) => {
          const codigosMarcados = new Set(codigos);
          this.incidencias.set(
            todas.filter((incidencia) =>
              identificadoresIncidencia(incidencia).some((identificador) => codigosMarcados.has(identificador)),
            ),
          );
        },
        error: () => this.error.set(true),
      });
  }

  desmarcar(incidencia: Incidencia): void {
    const identificadores = identificadoresIncidencia(incidencia);
    if (identificadores.length === 0) {
      return;
    }

    try {
      identificadores.forEach((identificador) => this.storageService.eliminarCodigoSeguimiento(identificador));
      this.incidencias.update((actuales) =>
        actuales.filter(
          (actual) =>
            !identificadoresIncidencia(actual).some((identificador) => identificadores.includes(identificador)),
        ),
      );
    } catch (error) {
      console.error('No se pudo quitar la incidencia del seguimiento local.', error);
      this.mensajeError.set('No se pudo quitar la incidencia del seguimiento local.');
    }
  }

  codigoIncidencia(incidencia: Incidencia): string {
    return incidencia.codigo?.trim() || String(incidencia.id).trim();
  }

  idIncidencia(incidencia: Incidencia): string {
    return String(incidencia.id).trim();
  }

  iconoTipo(tipo: Incidencia['tipo']): string {
    switch (tipo) {
      case 'luminarias dañadas':
        return 'flash-outline';
      case 'baches':
        return 'construct-outline';
      case 'señalización deteriorada':
        return 'alert-circle-outline';
      case 'alcantarillas obstruidas':
        return 'water-outline';
      case 'daños en parques':
        return 'leaf-outline';
    }
  }

  colorPrioridad(prioridad: Incidencia['prioridad']): string {
    switch (prioridad) {
      case 'alta':
        return 'danger';
      case 'media':
        return 'warning';
      case 'baja':
        return 'medium';
    }
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
