import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);
    const userRole = auth.getUserRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
}
