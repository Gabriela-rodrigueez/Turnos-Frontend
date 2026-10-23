import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => {
        Object.keys(store).forEach(k => delete store[k]);
      }
    };

    try {
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    } catch (_) {}

    if (typeof window !== 'undefined') {
      try {
        Object.defineProperty(window, 'localStorage', {
          value: mockStorage,
          writable: true,
          configurable: true
        });
      } catch (_) {}
    }

    mockStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('debe inicializarse sin sesión si no hay token en storage', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('debe conmutar a rol MEDICO y decodificar claims correctamente', () => {
    service.loginAsMedico();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getRol()).toBe('MEDICO');
    expect(service.hasRole(['MEDICO'])).toBe(true);
    expect(service.hasRole(['PACIENTE'])).toBe(false);
  });

  it('debe conmutar a rol PACIENTE y extraer dinámicamente el pacienteId del JWT', () => {
    service.loginAsPaciente(42);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getRol()).toBe('PACIENTE');
    expect(service.getPacienteId()).toBe(42);
    expect(service.hasRole(['ADMIN'])).toBe(false);
  });

  it('debe limpiar sesión y estado al ejecutar logout', () => {
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });
});

