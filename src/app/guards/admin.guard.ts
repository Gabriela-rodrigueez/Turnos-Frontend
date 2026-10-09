import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard funcional AdminGuard
 * Protege la ruta /admin y sus rutas hijas.
 * Valida que el usuario tenga rol 'ADMIN', 'ADMINISTRADOR' o 'MEDICO'.
 * Si el usuario posee rol 'PACIENTE' o no está autenticado, deniega el acceso y redirige a '/'.
 */
export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado y posee rol ADMIN / ADMINISTRADOR o MEDICO
  if (authService.isAuthenticated() && authService.hasRole(['ADMIN', 'ADMINISTRADOR', 'MEDICO'])) {
    return true;
  }

  // Si tiene rol PACIENTE o no está autenticado, redirigir al portal raíz
  console.warn('[AdminGuard] Acceso denegado a ruta protegida /admin. Redirigiendo a /');
  router.navigate(['/']);
  return false;
};

// Alias en minúsculas por conveniencia de importación
export const adminGuard = AdminGuard;
