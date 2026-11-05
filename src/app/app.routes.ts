import type { Routes } from '@angular/router';

import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/register/register.page').then((module) => module.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./detalle-incidencia/detalle-incidencia.page').then((module) => module.DetalleIncidenciaPage),
  },
  {
    path: 'nueva-incidencia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./nueva-incidencia/registro-incidencia.page').then((module) => module.RegistroIncidenciaPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
