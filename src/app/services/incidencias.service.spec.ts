import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';

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

  it('gets one incidence from its MockAPI resource URL', () => {
    let response: unknown;
    service.obtenerIncidenciaPorId('INC-001').subscribe((incidencia) => (response = incidencia));

    const request = http.expectOne(`${environment.mockApiUrl}/incidencias/INC-001`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'INC-001' });

    expect(response).toEqual({ id: 'INC-001' });
  });
});
