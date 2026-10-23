import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthGuard', () => {
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn().mockReturnValue(false)
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

  it('debe permitir acceso si el usuario está autenticado y no es MEDICO', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.hasRole.mockReturnValue(false);

    const resultado = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

    expect(resultado).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('debe denegar acceso y redirigir a /agenda si el usuario tiene rol MEDICO', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.hasRole.mockReturnValue(true);

    const resultado = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

    expect(resultado).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/agenda']);
  });

  it('debe denegar acceso y redirigir a /login-paciente si el usuario no está autenticado', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(false);

    const resultado = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

    expect(resultado).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login-paciente']);
  });
});
