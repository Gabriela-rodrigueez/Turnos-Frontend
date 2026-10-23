import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoMedicoGuard } from './no-medico.guard';
import { AuthService } from '../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NoMedicoGuard', () => {
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
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

  it('debe permitir acceso si el usuario no tiene rol MEDICO', () => {
    authServiceSpy.hasRole.mockReturnValue(false);

    const resultado = TestBed.runInInjectionContext(() => NoMedicoGuard({} as any, {} as any));

    expect(resultado).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('debe denegar acceso y redirigir a /agenda si el usuario tiene rol MEDICO', () => {
    authServiceSpy.hasRole.mockReturnValue(true);

    const resultado = TestBed.runInInjectionContext(() => NoMedicoGuard({} as any, {} as any));

    expect(resultado).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/agenda']);
  });
});
