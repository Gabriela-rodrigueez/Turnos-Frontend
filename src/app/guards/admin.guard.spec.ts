import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AdminGuard', () => {
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('debe permitir acceso si el usuario está autenticado y tiene rol ADMINISTRADOR', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('ADMIN') || roles.includes('ADMINISTRADOR'));

    const result = TestBed.runInInjectionContext(() => AdminGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('debe permitir acceso si el usuario está autenticado y tiene rol MEDICO', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('MEDICO'));

    const result = TestBed.runInInjectionContext(() => AdminGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('debe denegar acceso y redirigir a / si el usuario tiene rol PACIENTE', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.hasRole.mockReturnValue(false); // PACIENTE no tiene rol ADMIN ni MEDICO

    const result = TestBed.runInInjectionContext(() => AdminGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('debe denegar acceso y redirigir a / si el usuario no está autenticado', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(false);
    authServiceSpy.hasRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => AdminGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
