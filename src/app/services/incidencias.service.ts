import { HttpClient, HttpParams } from '@angular/common/http';
import type { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, catchError, expand, reduce, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type { EstadoIncidencia, Incidencia, NuevaIncidencia } from '../models/incidencia.model';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private readonly http = inject(HttpClient);
  private readonly incidenciasUrl = `${environment.mockApiUrl}/incidencias`;

  obtenerIncidencias(page = 1, limit = 8): Observable<Incidencia[]> {
    const params = new HttpParams().set('page', page).set('limit', limit).set('sortBy', 'fecha').set('order', 'desc');

    return this.http.get<Incidencia[]>(this.incidenciasUrl, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn(
          'MockAPI no aceptó los parámetros de ordenamiento; se repetirá la consulta solo con page y limit.',
          error,
        );
        const parametrosBasicos = new HttpParams().set('page', page).set('limit', limit);
        return this.http
          .get<Incidencia[]>(this.incidenciasUrl, { params: parametrosBasicos })
          .pipe(catchError(this.manejarError('obtener incidencias')));
      }),
    );
  }

  obtenerIncidenciaPorId(id: string): Observable<Incidencia> {
    return this.http
      .get<Incidencia>(`${this.incidenciasUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError(this.manejarError('obtener incidencia')));
  }

  obtenerTodasLasIncidencias(limit = 100): Observable<Incidencia[]> {
    return this.obtenerIncidencias(1, limit).pipe(
      expand((incidencias, index) => (incidencias.length < limit ? EMPTY : this.obtenerIncidencias(index + 2, limit))),
      reduce((todas, incidencias) => todas.concat(incidencias), [] as Incidencia[]),
    );
  }

  crearIncidencia(incidencia: NuevaIncidencia): Observable<Incidencia> {
    return this.http
      .post<Incidencia>(this.incidenciasUrl, incidencia)
      .pipe(catchError(this.manejarError('crear incidencia')));
  }

  actualizarEstadoYObservacion(
    id: string,
    cambios: Pick<Incidencia, 'estado' | 'observacion'>,
  ): Observable<Incidencia> {
    return this.http
      .patch<Incidencia>(`${this.incidenciasUrl}/${encodeURIComponent(id)}`, cambios)
      .pipe(catchError(this.manejarError('actualizar estado y observación')));
  }

  reemplazarIncidencia(id: string, incidencia: Incidencia): Observable<Incidencia> {
    return this.http
      .put<Incidencia>(`${this.incidenciasUrl}/${encodeURIComponent(id)}`, incidencia)
      .pipe(catchError(this.manejarError('actualizar incidencia')));
  }

  actualizarEstado(id: string, estado: EstadoIncidencia, observacion: string): Observable<Incidencia> {
    return this.actualizarEstadoYObservacion(id, { estado, observacion });
  }

  private manejarError(operacion: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`Error al ${operacion}.`, error);
      return throwError(() => error);
    };
  }
}
