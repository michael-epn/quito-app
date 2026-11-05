import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';

import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CloudinaryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the image with an unsigned preset and returns the secure URL', () => {
    let url = '';
    service.subirImagen('data:image/jpeg;base64,abc').subscribe((resultado) => (url = resultado));

    const request = http.expectOne(`https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect(request.request.body.get('file')).toBe('data:image/jpeg;base64,abc');
    expect(request.request.body.get('upload_preset')).toBe(environment.cloudinary.uploadPreset);

    request.flush({ secure_url: 'https://res.cloudinary.com/test/image/upload/evidencia.jpg' });
    expect(url).toBe('https://res.cloudinary.com/test/image/upload/evidencia.jpg');
  });

  it('reports an error when the upload request fails', () => {
    let error: unknown;
    service.subirImagen('data:image/jpeg;base64,abc').subscribe({ error: (resultado) => (error = resultado) });

    const request = http.expectOne(`https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`);
    request.flush({ error: { message: 'Upload rejected' } }, { status: 400, statusText: 'Bad Request' });

    expect(error).toEqual(new Error('No se pudo subir la evidencia fotográfica a Cloudinary.'));
  });
});
