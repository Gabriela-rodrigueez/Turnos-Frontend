import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscarTurnoComponent } from './buscar-turno';
import { EspecialidadService } from '../../services/especialidad';
import { SedeService } from '../../services/sede';
import { ProfesionalService } from '../../services/profesional';
import { AuthService } from '../../services/auth';
import { FamiliarService } from '../../services/familiar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BuscarTurnoComponent', () => {
  let component: BuscarTurnoComponent;
  let fixture: ComponentFixture<BuscarTurnoComponent>;
  let httpMock: HttpTestingController;

  let authServiceSpy: any;
  let familiarServiceSpy: any;
  let especialidadServiceSpy: any;
  let sedeServiceSpy: any;
  let profesionalServiceSpy: any;

  const mockFamiliares = [
    {
      id: 2,
      nombre: 'Mateo',
      apellido: 'González',
      dni: '55333444',
      fechaNacimiento: '2016-04-10',
      parentesco: 'Hijo/a',
      isActive: true
    }
  ];

  beforeEach(async () => {
    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getPacienteId: vi.fn().mockReturnValue(1),
      currentUser: vi.fn().mockReturnValue({ pacienteId: 1, nombreCompleto: 'Juan González', dni: '35111222', rol: 'PACIENTE' }),
      hasRole: vi.fn().mockReturnValue(false)
    };

    familiarServiceSpy = {
      listarFamiliares: vi.fn().mockReturnValue(of(mockFamiliares)),
      calcularEdad: vi.fn().mockReturnValue(8)
    };

    especialidadServiceSpy = {
      getEspecialidades: vi.fn().mockReturnValue(of([{ id: 1, nombre: 'Cardiología' }]))
    };

    sedeServiceSpy = {
      getSedes: vi.fn().mockReturnValue(of([{ id: 1, nombre: 'Hospital Central' }]))
    };

    profesionalServiceSpy = {
      getProfesionales: vi.fn().mockReturnValue(of([{ id: 1, nombre: 'Roberto', apellido: 'Pérez' }]))
    };

    await TestBed.configureTestingModule({
      imports: [BuscarTurnoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: FamiliarService, useValue: familiarServiceSpy },
        { provide: EspecialidadService, useValue: especialidadServiceSpy },
        { provide: SedeService, useValue: sedeServiceSpy },
        { provide: ProfesionalService, useValue: profesionalServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarTurnoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe inicializarse con el titular como beneficiario predeterminado y cargar familiares', () => {
    expect(component.beneficiarioSeleccionadoId).toBe(1);
    expect(component.familiares.length).toBe(1);
    expect(component.familiares[0].nombre).toBe('Mateo');
  });

  it('debe enviar el pacienteId del titular cuando se reserva para sí mismo', () => {
    const mockTurno = {
      id: 10,
      profesionalId: 1,
      especialidadId: 1,
      sedeId: 1,
      fechaHoraInicio: '2026-11-01T10:00:00'
    };

    component.seleccionarTurno(mockTurno);
    component.beneficiarioSeleccionadoId = 1; // Titular
    component.confirmar(mockTurno);

    const req = httpMock.expectOne('http://localhost:8080/api/v1/turnos/reserva');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.pacienteId).toBe(1);
    expect(req.request.body.turnoId).toBe(10);

    req.flush({ id: 10, estado: 'RESERVADO' });

    expect(component.turnoConfirmado).toBeTruthy();
    expect(component.turnoConfirmado?.beneficiarioNombre).toBe('Juan González');
    expect(component.turnoConfirmado?.beneficiarioParentesco).toBe('Titular');
  });

  it('debe enviar el pacienteId del familiar seleccionado al confirmar la reserva', () => {
    const mockTurno = {
      id: 12,
      profesionalId: 1,
      especialidadId: 1,
      sedeId: 1,
      fechaHoraInicio: '2026-11-01T11:00:00'
    };

    component.seleccionarTurno(mockTurno);
    // Cambiar beneficiario al hijo Mateo (ID 2)
    component.beneficiarioSeleccionadoId = 2;
    component.confirmar(mockTurno);

    const req = httpMock.expectOne('http://localhost:8080/api/v1/turnos/reserva');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.pacienteId).toBe(2);

    req.flush({ id: 12, estado: 'RESERVADO' });

    expect(component.turnoConfirmado).toBeTruthy();
    expect(component.turnoConfirmado?.beneficiarioId).toBe(2);
    expect(component.turnoConfirmado?.beneficiarioNombre).toBe('Mateo González');
    expect(component.turnoConfirmado?.beneficiarioParentesco).toBe('Hijo/a');
  });
});
