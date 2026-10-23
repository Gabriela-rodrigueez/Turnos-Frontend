import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarComponent } from './sidebar';
import { AuthService } from '../../../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      hasRole: vi.fn(),
      getRol: vi.fn().mockReturnValue('PACIENTE'),
      isAuthenticated: vi.fn().mockReturnValue(true),
      currentUser: vi.fn().mockReturnValue({ nombreCompleto: 'Juan González', rol: 'PACIENTE' }),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el componente Sidebar exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular correctamente las iniciales del usuario', () => {
    expect(component.userInitials).toBe('JG');
  });

  it('debe emitir closeSidebar y navegar al cerrar sesión', () => {
    const emitSpy = vi.spyOn(component.closeSidebar, 'emit');
    component.cerrarSesion();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('debe identificar rol admin cuando hasRole devuelve true', () => {
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('ADMINISTRADOR'));
    expect(component.esAdmin).toBe(true);
    expect(component.esMedico).toBe(false);
  });

  it('debe identificar rol médico cuando hasRole devuelve true', () => {
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('MEDICO'));
    expect(component.esMedico).toBe(true);
    expect(component.esAdmin).toBe(false);
  });

  it('debe calcular homeRoute adecuadamente según el rol del usuario', () => {
    // Paciente
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('PACIENTE'));
    expect(component.homeRoute).toBe('/mis-turnos');

    // Médico
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('MEDICO'));
    expect(component.homeRoute).toBe('/agenda');

    // Administrador
    authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('ADMINISTRADOR'));
    expect(component.homeRoute).toBe('/agenda');

    // No autenticado
    authServiceSpy.isAuthenticated.mockReturnValue(false);
    expect(component.homeRoute).toBe('/');
  });
});
