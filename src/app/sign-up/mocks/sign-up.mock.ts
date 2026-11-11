import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

export const signUpMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'POST' && req.url === '/api/sign-up') {
    return of(
      new HttpResponse({
        status: 200,
        body: null,
      }),
    ).pipe(delay(500));
  }
  return next(req);
};
