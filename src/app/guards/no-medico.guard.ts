import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard funcional NoMedicoGuard
 * Impide que los usuarios con rol MEDICO accedan a vistas ciudadanas de pacientes (/buscar).
 * Si el usuario posee rol MEDICO, lo redirige inmediatamente a su portal /agenda.
 */
export const NoMedicoGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(['MEDICO'])) {
    console.warn('[NoMedicoGuard] Acceso denegado a rol MEDICO en vista de búsqueda de turnos. Redirigiendo a /agenda');
    router.navigate(['/agenda']);
    return false;
  }

  return true;
};

export const noMedicoGuard = NoMedicoGuard;
