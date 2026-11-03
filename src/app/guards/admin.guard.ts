import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard funcional AdminGuard
 * Protege la ruta /admin y sus rutas hijas.
 * Valida que el usuario tenga rol 'ADMIN', 'ADMINISTRADOR' o 'MEDICO'.
 * Si la ruta define un rol específico requerido en route.data['rol'], valida exclusividad.
 * Si el usuario posee rol 'PACIENTE' o no está autenticado, deniega el acceso y redirige a '/'.
 */
export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    console.warn('[AdminGuard] Acceso denegado a ruta protegida /admin. Redirigiendo a /');
    router.navigate(['/']);
    return false;
  }

  // Si la ruta define un rol específico requerido (ej. 'ADMINISTRADOR' en data.rol)
  const rolRequerido = route?.data?.['rol'];
  if (rolRequerido) {
    const rolesValidos = Array.isArray(rolRequerido) ? [...rolRequerido] : [rolRequerido];
    if (rolesValidos.includes('ADMINISTRADOR') && !rolesValidos.includes('ADMIN')) {
      rolesValidos.push('ADMIN');
    }
    if (authService.hasRole(rolesValidos)) {
      return true;
    }
    console.warn(`[AdminGuard] Acceso denegado: se requiere rol ${rolRequerido}. Redirigiendo a /`);
    router.navigate(['/']);
    return false;
  }

  // Por defecto, verificar si posee rol ADMIN / ADMINISTRADOR o MEDICO
  if (authService.hasRole(['ADMIN', 'ADMINISTRADOR', 'MEDICO'])) {
    return true;
  }

  // Si tiene rol PACIENTE u otro no autorizado, redirigir al portal raíz
  console.warn('[AdminGuard] Acceso denegado a ruta protegida /admin. Redirigiendo a /');
  router.navigate(['/']);
  return false;
};

// Alias en minúsculas por conveniencia de importación
export const adminGuard = AdminGuard;
