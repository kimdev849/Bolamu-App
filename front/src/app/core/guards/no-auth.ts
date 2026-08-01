import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Diagnostic temporaire : tracer la décision de navigation
  console.log('[BOLAMU-DEBUG] noAuthGuard sur', state.url, '| isLoggedIn:', auth.isLoggedIn(), '| role:', auth.getUserRole());

  if (auth.isLoggedIn()) {
    const role = auth.getUserRole();
    const dashboardRoute = role ? `/${role}/dashboard` : '/';
    console.log('[BOLAMU-DEBUG] noAuthGuard → redirection vers', dashboardRoute);
    router.navigate([dashboardRoute]);
    return false;
  }

  console.log('[BOLAMU-DEBUG] noAuthGuard → accès autorisé (non connecté)');
  return true;
};
