import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
export class IncidenciasPage {
  private readonly incidenciasService = inject(IncidenciasService);
  private readonly storageService = inject(StorageService);

  incidencias: Incidencia[] = [];
  codigosSeguimiento = new Set<string>();
  paginaSiguiente = 1;
  cargando = false;
  error = false;
  finDeLista = false;

  constructor() {
    addIcons({ bookmark, bookmarkOutline });
  }

  ionViewWillEnter(): void {
    this.recargar();
  }

  recargar(): void {
    this.incidencias = [];
    this.paginaSiguiente = 1;
    this.finDeLista = false;
    this.error = false;
    this.cargando = true;
    this.incidenciasService.obtenerIncidencias(1, LIMITE_POR_PAGINA).subscribe({
      next: (pagina) => {
        this.incidencias = pagina;
        this.paginaSiguiente = 2;
        this.finDeLista = pagina.length < LIMITE_POR_PAGINA;
        this.cargando = false;
        this.sincronizarSeguimiento();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
  }

  cargarSiguientePagina(event: InfiniteScrollCustomEvent): void {
    this.cargarPaginaSiguiente(event);
  }

  reintentarSiguientePagina(): void {
    this.cargarPaginaSiguiente();
  }

  private cargarPaginaSiguiente(event?: InfiniteScrollCustomEvent): void {
    if (this.finDeLista || this.cargando) {
      if (event) {
        void event.target.complete();
      }
      return;
    }

    this.cargando = true;
    this.error = false;
    this.incidenciasService.obtenerIncidencias(this.paginaSiguiente, LIMITE_POR_PAGINA).subscribe({
      next: (pagina) => {
        this.incidencias = [...this.incidencias, ...pagina];
        this.paginaSiguiente += 1;
        this.finDeLista = pagina.length < LIMITE_POR_PAGINA;
        if (event) {
          event.target.disabled = this.finDeLista;
          void event.target.complete();
        }
        this.cargando = false;
        this.sincronizarSeguimiento();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        if (event) {
          void event.target.complete();
        }
      },
    });
  }

  alternarSeguimiento(incidencia: Incidencia): void {
    if (this.codigosSeguimiento.has(incidencia.id)) {
      this.storageService.eliminarCodigoSeguimiento(incidencia.id);
      this.codigosSeguimiento.delete(incidencia.id);
      return;
    }

    this.storageService.guardarCodigoSeguimiento(incidencia.id);
    this.codigosSeguimiento.add(incidencia.id);
  }

  estaEnSeguimiento(codigo: string): boolean {
    return this.codigosSeguimiento.has(codigo);
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

  private sincronizarSeguimiento(): void {
    this.codigosSeguimiento = new Set(this.storageService.obtenerCodigosSeguimiento());
  }
}
