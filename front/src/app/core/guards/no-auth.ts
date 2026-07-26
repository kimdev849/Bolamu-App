import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    const role = auth.getUserRole();
    const dashboardRoute = role ? `/${role}/dashboard` : '/';
    router.navigate([dashboardRoute]);
    return false;
  }

  return true;
};
