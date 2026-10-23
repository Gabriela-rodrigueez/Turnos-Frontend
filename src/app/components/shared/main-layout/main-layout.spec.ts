import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MainLayoutComponent } from './main-layout';
import { AuthService } from '../../../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(false),
      getRol: vi.fn().mockReturnValue('PACIENTE'),
      isAuthenticated: vi.fn().mockReturnValue(true),
      currentUser: vi.fn().mockReturnValue({ nombreCompleto: 'Juan González', rol: 'PACIENTE' }),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el MainLayoutComponent exitosamente', () => {
    expect(component).toBeTruthy();
    expect(component.sidebarOpen).toBe(false);
  });

  it('debe alternar y cerrar el estado del sidebar', () => {
    component.toggleSidebar();
    expect(component.sidebarOpen).toBe(true);
    component.closeSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('debe cerrar sesión y navegar al home', () => {
    component.cerrarSesion();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.sidebarOpen).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
