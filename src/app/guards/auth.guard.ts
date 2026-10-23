import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard funcional AuthGuard
 * Protege rutas que requieren sesión activa (por ejemplo, /mis-turnos).
 * Si el usuario no está autenticado, redirige al login de paciente.
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (authService.hasRole(['MEDICO'])) {
      console.warn('[AuthGuard] Acceso denegado a rol MEDICO en vista de turnos de paciente. Redirigiendo a /agenda');
      router.navigate(['/agenda']);
      return false;
    }
    return true;
  }

  console.warn('[AuthGuard] Acceso denegado: se requiere inicio de sesión. Redirigiendo a /login-paciente');
  router.navigate(['/login-paciente']);
  return false;
};

export const authGuard = AuthGuard;
