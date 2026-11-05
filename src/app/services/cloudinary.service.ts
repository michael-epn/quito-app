import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

interface RespuestaCloudinary {
  secure_url?: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly http = inject(HttpClient);

  subirImagen(imagenBase64ODataUrl: string): Observable<string> {
    const formulario = new FormData();
    formulario.append('file', imagenBase64ODataUrl);
    formulario.append('upload_preset', environment.cloudinary.uploadPreset);

    return this.http
      .post<RespuestaCloudinary>(
        `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`,
        formulario,
      )
      .pipe(
        map((respuesta) => {
          if (!respuesta.secure_url) {
            throw new Error('Cloudinary no devolvió una URL segura para la imagen.');
          }
          return respuesta.secure_url;
        }),
        catchError((error: unknown) => {
          console.error('No se pudo subir la evidencia fotográfica a Cloudinary.', error);
          return throwError(() => new Error('No se pudo subir la evidencia fotográfica a Cloudinary.'));
        }),
      );
  }
}
