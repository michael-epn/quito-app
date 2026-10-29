import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, timeout } from 'rxjs';
import type { Observable } from 'rxjs';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
  };
}

export interface ClimaActual {
  temperatura: number | null;
  precipitacion: number | null;
  descripcion: string;
  alertaLluvia: boolean;
  error: boolean;
  mensajeError?: string;
}

const DESCRIPCIONES_WMO: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada intensa',
  71: 'Nevada ligera',
  73: 'Nevada moderada',
  75: 'Nevada intensa',
  77: 'Granizo menudo',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo intenso',
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';

  obtenerClimaActual(latitud: number, longitud: number): Observable<ClimaActual> {
    const params = new HttpParams()
      .set('latitude', latitud)
      .set('longitude', longitud)
      .set('current', 'temperature_2m,precipitation,weather_code');

    return this.http.get<OpenMeteoResponse>(this.forecastUrl, { params }).pipe(
      timeout({ first: 8000 }),
      map(({ current }) => ({
        temperatura: current.temperature_2m,
        precipitacion: current.precipitation,
        descripcion: DESCRIPCIONES_WMO[current.weather_code] ?? 'Condición climática desconocida',
        alertaLluvia: current.precipitation > 5,
        error: false,
      })),
      catchError((error: unknown) => {
        console.error('Error al consultar el clima actual.', error);
        return of({
          temperatura: null,
          precipitacion: null,
          descripcion: 'No se pudo consultar el clima',
          alertaLluvia: false,
          error: true,
          mensajeError: 'El servicio meteorológico no está disponible. Inténtalo más tarde.',
        });
      }),
    );
  }
}
