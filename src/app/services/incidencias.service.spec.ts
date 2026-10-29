import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import type { NuevaIncidencia } from '../models/incidencia.model';

import { IncidenciasService } from './incidencias.service';

describe('IncidenciasService', () => {
  let service: IncidenciasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IncidenciasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retries pagination without sort parameters if MockAPI rejects sorting', () => {
    let response: unknown;
    service.obtenerIncidencias(2, 8).subscribe((incidencias) => (response = incidencias));

    const sortedRequest = http.expectOne(
      (request) =>
        request.url.endsWith('/incidencias') &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '8' &&
        request.params.get('sortBy') === 'fecha' &&
        request.params.get('order') === 'desc',
    );
    sortedRequest.flush({ message: 'Sorting unavailable' }, { status: 400, statusText: 'Bad Request' });

    const fallbackRequest = http.expectOne(
      (request) =>
        request.url.endsWith('/incidencias') &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '8' &&
        request.params.keys().length === 2,
    );
    expect(fallbackRequest.request.method).toBe('GET');
    fallbackRequest.flush([{ id: 'INC-009' }]);

    expect(response).toEqual([{ id: 'INC-009' }]);
  });

  it('gets one incidence from its MockAPI resource URL using the numeric ID', () => {
    let response: unknown;
    service.obtenerIncidenciaPorId('27').subscribe((incidencia) => (response = incidencia));

    const request = http.expectOne(`${environment.mockApiUrl}/incidencias/27`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: '27', codigo: 'INC-001' });

    expect(response).toEqual({ id: '27', codigo: 'INC-001' });
  });

  it('resolves a code route parameter against the incidence collection', () => {
    let response: unknown;
    service.obtenerIncidenciaPorId('INC-025').subscribe((incidencia) => (response = incidencia));

    const request = http.expectOne(
      (candidate) =>
        candidate.url.endsWith('/incidencias') &&
        candidate.method === 'GET' &&
        candidate.params.get('page') === '1' &&
        candidate.params.get('limit') === '100',
    );
    request.flush([{ id: '27', codigo: 'INC-025' }]);

    expect(response).toEqual({ id: '27', codigo: 'INC-025' });
  });

  it('creates an incidence with the next code and leaves the server ID out of the POST', () => {
    const incidencia: NuevaIncidencia = {
      tipo: 'baches',
      descripcion: 'Bache en la calzada.',
      direccion: 'Av. Amazonas',
      sector: 'Iñaquito',
      fecha: '2026-10-29',
      estado: 'pendiente',
      prioridad: 'media',
      fotografia: '',
      observacion: '',
    };
    let response: unknown;

    service.crearIncidencia(incidencia).subscribe((resultado) => (response = resultado));

    const consulta = http.expectOne(
      (request) =>
        request.url.endsWith('/incidencias') &&
        request.method === 'GET' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '100',
    );
    consulta.flush([
      { ...incidencia, id: 'INC-023' },
      { ...incidencia, id: '26', codigo: 'INC-025' },
    ]);

    const post = http.expectOne((request) => request.url.endsWith('/incidencias') && request.method === 'POST');
    expect(post.request.body).toEqual({ ...incidencia, codigo: 'INC-026' });
    expect(post.request.body).not.toHaveProperty('id');
    post.flush({ ...post.request.body, id: '27' });

    expect(response).toEqual({ ...incidencia, codigo: 'INC-026', id: '27' });
  });

  it('starts the incidence code sequence at INC-001 when the API is empty', () => {
    const incidencia: NuevaIncidencia = {
      tipo: 'luminarias dañadas',
      descripcion: 'Luminaria apagada.',
      direccion: 'Av. 6 de Diciembre',
      sector: 'La Mariscal',
      fecha: '2026-10-29',
      estado: 'pendiente',
      prioridad: 'baja',
      fotografia: '',
      observacion: '',
    };

    service.crearIncidencia(incidencia).subscribe();

    http
      .expectOne(
        (request) =>
          request.url.endsWith('/incidencias') && request.method === 'GET' && request.params.get('limit') === '100',
      )
      .flush([]);

    const post = http.expectOne((request) => request.url.endsWith('/incidencias') && request.method === 'POST');
    expect(post.request.body.codigo).toBe('INC-001');
    post.flush({ ...post.request.body, id: '1' });
  });
});
