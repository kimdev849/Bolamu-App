import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Toast } from '../services/toast';

function getErrorMessage(err: HttpErrorResponse | Error | unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    return `Erreur ${err.status}: ${err.statusText}`;
  }
  if (err instanceof Error) return err.message;
  return 'Une erreur inattendue est survenue';
}

/**
 * Routes d'authentification où les erreurs 401 sont gérées localement par les composants.
 * L'intercepteur ne doit pas afficher de toast 'Session expirée' pour ces routes.
 */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/me',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(Toast);

  return next(req).pipe(
    catchError((err: HttpErrorResponse | Error | unknown) => {
      const message = getErrorMessage(err);

      if (err instanceof HttpErrorResponse) {
        switch (err.status) {
          case 401: {
            const isAuthRoute = AUTH_ROUTES.some((route) => req.url.includes(route));
            const hadToken = !!req.headers.get('Authorization');

            if (isAuthRoute) {
              // Les pages d'auth gèrent elles-mêmes leurs erreurs 401
              break;
            }

            if (hadToken) {
              // L'utilisateur avait un token → session expirée
              toast.error('Session expirée', 'Veuillez vous reconnecter');
            }
            // Sans token et hors route auth → on ignore (cas rare)
            break;
          }
          case 403:
            toast.error('Accès refusé', 'Vous n\'avez pas les permissions nécessaires');
            break;
          case 404:
            toast.warning('Non trouvé', message);
            break;
          case 422:
            toast.warning('Données invalides', message);
            break;
          case 500:
            toast.error('Erreur serveur', message);
            break;
          default:
            toast.error('Erreur', message);
        }
      } else {
        toast.error('Erreur réseau', 'Impossible de contacter le serveur');
      }

      return throwError(() => err);
    }),
  );
};
