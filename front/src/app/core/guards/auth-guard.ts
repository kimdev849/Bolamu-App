import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../services/token';

export const authGuard: CanActivateFn = (route, state) => {
  const token = inject(Token);
  const router = inject(Router);

  if (token.hasValidToken()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
