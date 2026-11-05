import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = await authService.waitForAuthInitialization();

  return user ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = await authService.waitForAuthInitialization();

  return user ? router.createUrlTree(['/inicio']) : true;
};
