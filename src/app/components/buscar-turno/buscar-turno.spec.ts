import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscarTurnoComponent, Turno } from './buscar-turno';
import { EspecialidadService } from '../../services/especialidad';
import { SedeService } from '../../services/sede';
import { ProfesionalService } from '../../services/profesional';
import { HistorialClinicoService, PacienteItem } from '../../services/historial-clinico';
import { AuthService } from '../../services/auth';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BuscarTurnoComponent', () => {
  let component: BuscarTurnoComponent;
  let fixture: ComponentFixture<BuscarTurnoComponent>;
  let httpTesting: HttpTestingController;

  let especialidadServiceSpy: any;
  let sedeServiceSpy: any;
  let profesionalServiceSpy: any;
  let historialServiceSpy: any;
  let authServiceSpy: any;
  let router: Router;

  const mockEspecialidades = [{ id: 1, nombre: 'Cardiología' }];
  const mockSedes = [{ id: 1, nombre: 'Hospital Central' }];
  const mockProfesionales = [{ id: 10, nombre: 'Roberto', apellido: 'Pérez' }];
  const mockPacientes: PacienteItem[] = [
    { id: 25, nombre: 'Lucía', apellido: 'Martínez', dni: '35111222', obraSocialNombre: 'PAMI' }
  ];

  beforeEach(async () => {
    especialidadServiceSpy = {
      getEspecialidades: vi.fn().mockReturnValue(of(mockEspecialidades))
    };
    sedeServiceSpy = {
      getSedes: vi.fn().mockReturnValue(of(mockSedes))
    };
    profesionalServiceSpy = {
      getProfesionales: vi.fn().mockReturnValue(of(mockProfesionales))
    };
    historialServiceSpy = {
      obtenerPacientes: vi.fn().mockReturnValue(of(mockPacientes))
    };
    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(false),
      getPacienteId: vi.fn().mockReturnValue(1),
      currentUser: vi.fn().mockReturnValue({ id: 1, nombreCompleto: 'Juan González' }),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BuscarTurnoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EspecialidadService, useValue: especialidadServiceSpy },
        { provide: SedeService, useValue: sedeServiceSpy },
        { provide: ProfesionalService, useValue: profesionalServiceSpy },
        { provide: HistorialClinicoService, useValue: historialServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BuscarTurnoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe crearse e inicializar los catálogos', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.especialidades.length).toBe(1);
    expect(component.sedes.length).toBe(1);
    expect(component.profesionales.length).toBe(1);
  });

  it('debe requerir especialidad para buscar disponibilidad', () => {
    fixture.detectChanges();
    component.espSeleccionada = null;
    component.buscar();
    expect(component.mensajeError).toContain('seleccione una especialidad médica');
    expect(component.turnosDisponibles.length).toBe(0);
  });

  it('debe buscar turnos disponibles por especialidad', () => {
    fixture.detectChanges();
    component.espSeleccionada = 1;
    component.buscar();

    const req = httpTesting.expectOne('http://localhost:8080/api/v1/turnos/disponibilidad?especialidadId=1');
    expect(req.request.method).toBe('GET');

    const mockSlots: Turno[] = [
      { id: 101, fechaHoraInicio: '2026-11-06T10:00:00', estado: 'DISPONIBLE' }
    ];
    req.flush(mockSlots);

    expect(component.turnosDisponibles.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  describe('Flujo de Administrador / Mesa de Entrada', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockImplementation((roles: string[]) => roles.includes('ADMINISTRADOR'));
      fixture.detectChanges();
    });

    it('debe reconocer rol administrador', () => {
      expect(component.esAdmin).toBe(true);
    });

    it('debe buscar pacientes por filtro', () => {
      component.busquedaPaciente = 'Martínez';
      component.buscarPacientes();

      expect(historialServiceSpy.obtenerPacientes).toHaveBeenCalledWith('Martínez');
      expect(component.pacientesSugeridos.length).toBe(1);
      expect(component.pacientesSugeridos[0].nombre).toBe('Lucía');
    });

    it('debe seleccionar y cambiar paciente', () => {
      component.seleccionarPaciente(mockPacientes[0]);
      expect(component.pacienteSeleccionado).toEqual(mockPacientes[0]);

      component.cambiarPaciente();
      expect(component.pacienteSeleccionado).toBeNull();
      expect(component.busquedaPaciente).toBe('');
    });

    it('no debe permitir confirmar turno si es admin y no seleccionó paciente', () => {
      component.pacienteSeleccionado = null;
      const turnoSlot: Turno = { id: 50, fechaHoraInicio: '2026-11-06T10:00:00' };

      component.confirmar(turnoSlot);

      expect(component.mensajeError).toContain('Debe seleccionar un paciente');
      httpTesting.expectNone('http://localhost:8080/api/v1/turnos/reserva');
    });

    it('debe reservar turno enviando el pacienteId del paciente seleccionado por el administrador', () => {
      component.seleccionarPaciente(mockPacientes[0]);
      const turnoSlot: Turno = {
        id: 50,
        profesionalId: 10,
        especialidadId: 1,
        sedeId: 1,
        fechaHoraInicio: '2026-11-06T10:00:00'
      };

      component.motivoConsulta = 'Control anual';
      component.confirmar(turnoSlot);

      const req = httpTesting.expectOne('http://localhost:8080/api/v1/turnos/reserva');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.pacienteId).toBe(25); // ID de Lucía Martínez
      expect(req.request.body.turnoId).toBe(50);
      expect(req.request.body.motivoConsulta).toBe('Control anual');

      req.flush({ id: 50, estado: 'RESERVADO' });

      expect(component.turnoConfirmado).toBeTruthy();
      expect(component.turnoConfirmado?.pacienteNombreCompleto).toContain('Martínez, Lucía');
      expect(component.turnoConfirmado?.pacienteDni).toBe('35111222');
      expect(component.mensajeExito).toContain('Turno reservado exitosamente');
    });
  });

  describe('Flujo de Paciente', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false);
      authServiceSpy.getPacienteId.mockReturnValue(77);
      fixture.detectChanges();
    });

    it('debe reservar turno enviando el propio pacienteId del paciente conectado', () => {
      const turnoSlot: Turno = {
        id: 50,
        profesionalId: 10,
        especialidadId: 1,
        sedeId: 1,
        fechaHoraInicio: '2026-11-06T10:00:00'
      };

      component.confirmar(turnoSlot);

      const req = httpTesting.expectOne('http://localhost:8080/api/v1/turnos/reserva');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.pacienteId).toBe(77);

      req.flush({ id: 50, estado: 'RESERVADO' });

      expect(component.turnoConfirmado).toBeTruthy();
    });
  });
});
