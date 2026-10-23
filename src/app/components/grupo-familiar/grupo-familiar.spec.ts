import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GrupoFamiliarComponent } from './grupo-familiar';
import { FamiliarService, Familiar } from '../../services/familiar';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GrupoFamiliarComponent', () => {
  let component: GrupoFamiliarComponent;
  let fixture: ComponentFixture<GrupoFamiliarComponent>;
  let familiarServiceMock: any;
  let authServiceMock: any;

  const mockFamiliares: Familiar[] = [
    {
      id: 2,
      nombre: 'Mateo',
      apellido: 'González',
      dni: '55333444',
      fechaNacimiento: '2016-04-10',
      parentesco: 'Hijo/a',
      obraSocialNombre: 'OSEP Mendoza',
      isActive: true
    }
  ];

  beforeEach(async () => {
    familiarServiceMock = {
      listarFamiliares: vi.fn().mockReturnValue(of(mockFamiliares)),
      registrarFamiliar: vi.fn().mockImplementation((tutorId, req) => of({ id: 5, ...req, isActive: true })),
      darDeBajaFamiliar: vi.fn().mockReturnValue(of(null)),
      calcularEdad: vi.fn().mockReturnValue(8)
    };

    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getPacienteId: vi.fn().mockReturnValue(1),
      currentUser: vi.fn().mockReturnValue({ pacienteId: 1, nombreCompleto: 'Juan González', rol: 'PACIENTE' }),
      hasRole: vi.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [GrupoFamiliarComponent],
      providers: [
        provideRouter([]),
        { provide: FamiliarService, useValue: familiarServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GrupoFamiliarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de familiares activos al inicializar', () => {
    expect(familiarServiceMock.listarFamiliares).toHaveBeenCalledWith(1);
    expect(component.familiares.length).toBe(1);
    expect(component.familiares[0].nombre).toBe('Mateo');
  });

  it('debe validar formulario reactivo para nuevo familiar', () => {
    component.abrirModalAgregar();
    expect(component.formFamiliar.valid).toBe(false);

    // Campos inválidos
    component.formFamiliar.patchValue({
      nombre: 'A', // min 2
      apellido: '',
      dni: '123', // pattern 7-8
      fechaNacimiento: '2099-01-01', // futura
      parentesco: 'Hijo/a'
    });
    expect(component.formFamiliar.valid).toBe(false);

    // Campos válidos
    component.formFamiliar.patchValue({
      nombre: 'Lucía',
      apellido: 'González',
      dni: '56111222',
      fechaNacimiento: '2020-05-15',
      parentesco: 'Hijo/a',
      obraSocialId: 1
    });
    expect(component.formFamiliar.valid).toBe(true);
  });

  it('debe registrar un familiar y agregarlo a la lista', () => {
    component.abrirModalAgregar();
    component.formFamiliar.patchValue({
      nombre: 'Lucía',
      apellido: 'González',
      dni: '56111222',
      fechaNacimiento: '2020-05-15',
      parentesco: 'Hijo/a',
      obraSocialId: 1
    });

    component.guardarFamiliar();

    expect(familiarServiceMock.registrarFamiliar).toHaveBeenCalled();
    expect(component.familiares.length).toBe(2);
    expect(component.mensajeExito).toContain('Lucía');
    expect(component.mostrarModalAgregar).toBe(false);
  });

  it('debe dar de baja lógica a un familiar al confirmar en el modal', () => {
    const familiar = component.familiares[0];
    component.iniciarBaja(familiar);
    expect(component.familiarABajar).toEqual(familiar);

    component.confirmarBaja();
    expect(familiarServiceMock.darDeBajaFamiliar).toHaveBeenCalledWith(1, 2);
    expect(component.familiares.length).toBe(0);
    expect(component.familiarABajar).toBeNull();
  });
});
