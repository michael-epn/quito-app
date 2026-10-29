import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
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
    IonSpinner,
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
    return identificadoresIncidencia(incidencia)[0] ?? '';
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
