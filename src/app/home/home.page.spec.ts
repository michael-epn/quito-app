import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ionViewWillEnter();
    httpTestingController
      .expectOne((request) => request.url.endsWith('/incidencias') && request.params.get('page') === '1')
      .flush([{ estado: 'pendiente' }, { estado: 'en proceso' }, { estado: 'en proceso' }, { estado: 'resuelta' }]);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads indicators on initial entry and refreshes once when returning', () => {
    expect(component.totales()).toEqual({ pendiente: 1, 'en proceso': 2, resuelta: 1 });
    expect(component.cargando()).toBe(false);

    // The initial Ionic view-enter was ignored; returning to the page refreshes.
    component.ionViewWillEnter();
    const refreshRequest = httpTestingController.expectOne(
      (request) => request.url.endsWith('/incidencias') && request.params.get('page') === '1',
    );
    refreshRequest.flush([{ estado: 'resuelta' }]);
    expect(component.totales()).toEqual({ pendiente: 0, 'en proceso': 0, resuelta: 1 });
  });
});
