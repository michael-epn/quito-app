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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { InfiniteScrollCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { identificadoresIncidencia } from '../models/incidencia.model';
import type { EstadoIncidencia, Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';
import { StorageService } from '../services/storage.service';

const LIMITE_POR_PAGINA = 8;

@Component({
  selector: 'app-incidencias',
  templateUrl: './incidencias.page.html',
  styleUrls: ['./incidencias.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonBadge,
    IonButton,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    RouterLink,
    DatePipe,
    TitleCasePipe,
  ],
})
export class IncidenciasPage implements OnInit {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);
  private primeraEntrada = true;
  private readonly cargaEnCurso = signal(false);

  readonly incidencias = signal<Incidencia[]>([]);
  readonly codigosSeguimiento = signal(new Set<string>());
  readonly paginaActual = signal(1);
  readonly cargando = signal(false);
  readonly error = signal(false);
  readonly mensajeErrorLocal = signal('');
  readonly infiniteScrollDisabled = signal(false);

  constructor() {
    addIcons({ bookmark, bookmarkOutline });
  }

  ngOnInit(): void {
    this.recargar();
  }

  ionViewWillEnter(): void {
    if (this.primeraEntrada) {
      this.primeraEntrada = false;
      return;
    }

    this.recargar();
  }

  recargar(): void {
    if (this.cargaEnCurso()) {
      return;
    }

    this.paginaActual.set(1);
    this.incidencias.set([]);
    this.infiniteScrollDisabled.set(false);
    this.error.set(false);
    this.mensajeErrorLocal.set('');
    this.cargarPagina(1, true);
  }

  cargarSiguientePagina(event: InfiniteScrollCustomEvent): void {
    if (this.cargando() || this.infiniteScrollDisabled() || this.error()) {
      void event.target.complete();
      return;
    }

    this.cargarPagina(this.paginaActual() + 1, false, event);
  }

  reintentarSiguientePagina(): void {
    this.error.set(false);
    if (this.incidencias().length === 0) {
      this.recargar();
      return;
    }

    this.cargarPagina(this.paginaActual() + 1, false);
  }

  alternarSeguimiento(incidencia: Incidencia): void {
    const identificadores = identificadoresIncidencia(incidencia);
    if (identificadores.length === 0) {
      this.mensajeErrorLocal.set('Esta incidencia no tiene un código que se pueda guardar.');
      return;
    }

    try {
      const codigos = new Set(this.codigosSeguimiento());
      if (identificadores.some((identificador) => codigos.has(identificador))) {
        identificadores.forEach((identificador) => {
          this.storageService.eliminarCodigoSeguimiento(identificador);
          codigos.delete(identificador);
        });
      } else {
        identificadores.forEach((identificador) => {
          this.storageService.guardarCodigoSeguimiento(identificador);
          codigos.add(identificador);
        });
      }
      this.codigosSeguimiento.set(codigos);
      this.mensajeErrorLocal.set('');
    } catch (error) {
      console.error('No se pudo actualizar el seguimiento local de la incidencia.', error);
      this.mensajeErrorLocal.set('No se pudo guardar el cambio de seguimiento en este dispositivo.');
    }
  }

  estaEnSeguimiento(incidencia: Incidencia): boolean {
    return identificadoresIncidencia(incidencia).some((identificador) => this.codigosSeguimiento().has(identificador));
  }

  codigoIncidencia(incidencia: Incidencia): string {
    return incidencia.codigo?.trim() || String(incidencia.id).trim();
  }

  idIncidencia(incidencia: Incidencia): string {
    return String(incidencia.id).trim();
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

  private cargarPagina(pagina: number, reemplazar: boolean, event?: InfiniteScrollCustomEvent): void {
    if (this.cargaEnCurso()) {
      if (event) {
        void event.target.complete();
      }
      return;
    }

    this.cargaEnCurso.set(true);
    this.cargando.set(true);
    this.error.set(false);
    this.incidenciasService
      .obtenerIncidencias(pagina, LIMITE_POR_PAGINA)
      .pipe(
        finalize(() => {
          this.cargaEnCurso.set(false);
          this.cargando.set(false);
          if (event) {
            void event.target.complete();
          }
        }),
      )
      .subscribe({
        next: (respuesta) => {
          const nuevasIncidencias = reemplazar ? respuesta : [...this.incidencias(), ...respuesta];
          this.incidencias.set(nuevasIncidencias);
          this.paginaActual.set(pagina);
          this.infiniteScrollDisabled.set(respuesta.length < LIMITE_POR_PAGINA);
          if (event) {
            event.target.disabled = respuesta.length < LIMITE_POR_PAGINA;
          }
          this.sincronizarSeguimiento();
        },
        error: () => {
          this.error.set(true);
          this.infiniteScrollDisabled.set(true);
          if (event) {
            event.target.disabled = true;
          }
        },
      });
  }

  private sincronizarSeguimiento(): void {
    try {
      this.codigosSeguimiento.set(new Set(this.storageService.obtenerCodigosSeguimiento()));
      this.mensajeErrorLocal.set('');
    } catch (error) {
      console.error('No se pudieron leer los códigos locales de seguimiento.', error);
      this.mensajeErrorLocal.set('No se pudieron leer los marcadores guardados en este dispositivo.');
    }
  }
}
