import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ModuloPlaceholderComponent } from './modulo-placeholder';
import { AuthService } from '../../../services/auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModuloPlaceholderComponent', () => {
  let component: ModuloPlaceholderComponent;
  let fixture: ComponentFixture<ModuloPlaceholderComponent>;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getRol: vi.fn().mockReturnValue('ADMINISTRADOR')
    };

    await TestBed.configureTestingModule({
      imports: [ModuloPlaceholderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                titulo: 'Módulo de Prueba',
                issue: 'F-99',
                icono: '🧪',
                rol: 'ADMINISTRADOR',
                descripcion: 'Descripción de prueba'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente y cargar datos del route', () => {
    expect(component).toBeTruthy();
    expect(component.titulo).toBe('Módulo de Prueba');
    expect(component.issue).toBe('F-99');
    expect(component.icono).toBe('🧪');
  });

  it('debe calcular homeRoute apuntando a /agenda si es administrador o médico', () => {
    authServiceSpy.getRol.mockReturnValue('ADMINISTRADOR');
    expect(component.homeRoute).toBe('/agenda');

    authServiceSpy.getRol.mockReturnValue('MEDICO');
    expect(component.homeRoute).toBe('/agenda');
  });

  it('debe calcular homeRoute apuntando a /mis-turnos si es paciente', () => {
    authServiceSpy.getRol.mockReturnValue('PACIENTE');
    expect(component.homeRoute).toBe('/mis-turnos');
  });
});
