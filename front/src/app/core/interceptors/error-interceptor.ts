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

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(Toast);

  return next(req).pipe(
    catchError((err: HttpErrorResponse | Error | unknown) => {
      const message = getErrorMessage(err);

      if (err instanceof HttpErrorResponse) {
        switch (err.status) {
          case 401:
            toast.error('Session expirée', 'Veuillez vous reconnecter');
            break;
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
