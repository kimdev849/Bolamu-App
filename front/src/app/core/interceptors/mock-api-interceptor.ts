import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { handleRequest } from '../mock/handlers';

export const mockApiInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const result = handleRequest(req);

  if (result === null) {
    return next(req);
  }

  const response = new HttpResponse({
    status: result.status,
    body: result.body,
    url: req.url ?? undefined,
  });

  return of(response).pipe(delay(300));
};
