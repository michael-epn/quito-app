import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonImg,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import type { EstadoIncidencia, Incidencia } from '../models/incidencia.model';
import { IncidenciasService } from '../services/incidencias.service';

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
    IonSpinner,
    IonButton,
    RouterLink,
    DatePipe,
    TitleCasePipe,
  ],
})
export class DetalleIncidenciaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly incidenciasService = inject(IncidenciasService);

  incidencia: Incidencia | null = null;
  cargando = true;
  error = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === null) {
      this.cargando = false;
      this.error = true;
      return;
    }

    this.cargar(id);
  }

  cargar(id: string): void {
    this.cargando = true;
    this.error = false;
    this.incidenciasService.obtenerIncidenciaPorId(id).subscribe({
      next: (incidencia) => {
        this.incidencia = incidencia;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      },
    });
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
