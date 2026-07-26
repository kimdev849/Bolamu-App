import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Token } from '../services/token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Token);
  const accessToken = token.getAccessToken();

  if (accessToken) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
