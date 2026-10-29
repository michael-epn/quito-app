import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tabs/tabs.page').then((module) => module.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./home/home.page').then((module) => module.HomePage),
      },
      {
        path: 'incidencias',
        loadComponent: () => import('./incidencias/incidencias.page').then((module) => module.IncidenciasPage),
      },
      {
        path: 'seguimiento',
        loadComponent: () => import('./seguimiento/seguimiento.page').then((module) => module.SeguimientoPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'incidencia/:id',
    loadComponent: () =>
      import('./detalle-incidencia/detalle-incidencia.page').then((module) => module.DetalleIncidenciaPage),
  },
  {
    path: 'nueva-incidencia',
    loadComponent: () =>
      import('./nueva-incidencia/registro-incidencia.page').then((module) => module.RegistroIncidenciaPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
