import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../services/token';

export const authGuard: CanActivateFn = (route, state) => {
  const token = inject(Token);
  const router = inject(Router);

  // Diagnostic temporaire : tracer la décision de navigation
  console.log('[BOLAMU-DEBUG] authGuard sur', state.url, '| hasValidToken:', token.hasValidToken());

  if (token.hasValidToken()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
