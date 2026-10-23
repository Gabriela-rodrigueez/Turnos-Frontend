import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PortalComponent } from './portal';
import { AuthService } from '../../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PortalComponent', () => {
  let component: PortalComponent;
  let fixture: ComponentFixture<PortalComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      getRol: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [PortalComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PortalComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse exitosamente para usuarios sin autenticar', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe redirigir a /agenda si el usuario autenticado es MEDICO o ADMINISTRADOR', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.getRol.mockReturnValue('ADMINISTRADOR');

    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/agenda']);
  });

  it('debe redirigir a /mis-turnos si el usuario autenticado es PACIENTE', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.getRol.mockReturnValue('PACIENTE');

    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/mis-turnos']);
  });
});
