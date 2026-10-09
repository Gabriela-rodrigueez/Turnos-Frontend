import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let requestClonada = req;
  
  // Si hay token y la petición va hacia la API, adjuntamos la cabecera
  if (token && req.url.includes('/api/v1/')) {
    requestClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Manejamos la respuesta y posibles errores de seguridad
  return next(requestClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token expiró o es inválido, cerramos sesión automáticamente
      if (error.status === 401 || error.status === 403) {
        authService.logout(); 
      }
      return throwError(() => error);
    })
  );
};