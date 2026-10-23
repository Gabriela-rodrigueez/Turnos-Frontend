import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AgendaComponent } from './agenda';
import { AgendaService } from '../../../services/agenda';
import { EspecialidadService } from '../../../services/especialidad';
import { ProfesionalService } from '../../../services/profesional';
import { SedeService } from '../../../services/sede';
import { AuthService } from '../../../services/auth';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AgendaComponent', () => {
  let component: AgendaComponent;
  let fixture: ComponentFixture<AgendaComponent>;
  let agendaServiceSpy: any;
  let especialidadServiceSpy: any;
  let profesionalServiceSpy: any;
  let sedeServiceSpy: any;
  let authServiceSpy: any;

  beforeEach(async () => {
    agendaServiceSpy = {
      obtenerDisponibilidad: vi.fn().mockReturnValue(of([])),
      obtenerTurnosAgenda: vi.fn().mockReturnValue(of([])),
      generarSlots: vi.fn().mockReturnValue(of({ cantidadSlotsGenerados: 5 })),
      eliminarSlot: vi.fn().mockReturnValue(of(null)),
      cambiarEstado: vi.fn().mockReturnValue(of({ id: 1, estado: 'ASISTIDO' }))
    };

    especialidadServiceSpy = {
      getEspecialidades: vi.fn().mockReturnValue(of([
        { id: 1, nombre: 'Cardiología' },
        { id: 2, nombre: 'Pediatría' }
      ]))
    };

    profesionalServiceSpy = {
      getProfesionales: vi.fn().mockReturnValue(of([
        { id: 1, nombre: 'Roberto', apellido: 'Pérez' }
      ]))
    };

    sedeServiceSpy = {
      getSedes: vi.fn().mockReturnValue(of([
        { id: 1, nombre: 'Hospital Central' }
      ]))
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(false),
      getRol: vi.fn().mockReturnValue('ADMINISTRADOR'),
      logout: vi.fn(),
      currentUser: vi.fn().mockReturnValue({
        usuarioId: 1,
        rol: 'ADMINISTRADOR',
        nombreCompleto: 'Admin General'
      })
    };

    await TestBed.configureTestingModule({
      imports: [AgendaComponent],
      providers: [
        provideRouter([{ path: 'login-medico', children: [] }]),
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: EspecialidadService, useValue: especialidadServiceSpy },
        { provide: ProfesionalService, useValue: profesionalServiceSpy },
        { provide: SedeService, useValue: sedeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
    expect(component.especialidades.length).toBe(2);
  });

  it('debe bloquear el profesional automáticamente si el rol es MEDICO', () => {
    authServiceSpy.hasRole.mockReturnValue(true);
    authServiceSpy.currentUser.mockReturnValue({
      profesionalId: 99,
      rol: 'MEDICO',
      nombreCompleto: 'Dr. López'
    });

    component.detectarRolUsuario();

    expect(component.esMedico).toBe(true);
    expect(component.profesionalSeleccionado).toBe(99);
    expect(component.nombreMedicoFijo).toBe('Dr. López');
  });

  it('debe filtrar y autoseleccionar la especialidad del médico al cargar catálogos', () => {
    component.esMedico = true;
    component.profesionalSeleccionado = 1;
    especialidadServiceSpy.getEspecialidades.mockReturnValue(of([{ id: 1, nombre: 'Cardiología' }]));

    component.cargarCatalogos();

    expect(especialidadServiceSpy.getEspecialidades).toHaveBeenCalledWith(1);
    expect(component.especialidades.length).toBe(1);
    expect(component.especialidadSeleccionada).toBe(1);
  });

  it('debe exigir especialidad antes de abrir modal de generación de turnos', () => {
    component.especialidadSeleccionada = null;
    component.abrirModalGenerar();

    expect(component.modalGenerarAbierto).toBe(false);
    expect(component.mensajeError).toContain('especialidad');
  });

  it('debe abrir modal si la especialidad está seleccionada', () => {
    component.especialidadSeleccionada = 1;
    component.abrirModalGenerar();

    expect(component.modalGenerarAbierto).toBe(true);
    expect(component.genHoraInicio).toBe('08:00');
    expect(component.genHoraFin).toBe('12:00');
  });

  it('debe invocar generarSlots y recargar la agenda ante datos válidos', () => {
    component.especialidadSeleccionada = 1;
    component.profesionalSeleccionado = 1;
    component.genSedeId = 1;
    component.genFechaDesde = '2026-11-01';
    component.genFechaHasta = '2026-11-02';
    component.genHoraInicio = '08:00';
    component.genHoraFin = '10:00';
    component.genDuracionMinutos = 30;

    component.generarSlots();

    expect(agendaServiceSpy.generarSlots).toHaveBeenCalled();
    expect(component.modalGenerarAbierto).toBe(false);
    expect(component.mensajeExito).toContain('5 slots');
  });

  it('debe marcar un turno como ASISTIDO', () => {
    const turnoMock: any = { id: 10, estado: 'RESERVADO' };
    component.marcarAsistido(turnoMock);

    expect(agendaServiceSpy.cambiarEstado).toHaveBeenCalledWith(10, 'ASISTIDO');
    expect(turnoMock.estado).toBe('ASISTIDO');
  });

  it('debe calcular métricas y filtrar turnos por estado correctamente', () => {
    component.turnos = [
      { id: 1, estado: 'DISPONIBLE' },
      { id: 2, estado: 'RESERVADO' },
      { id: 3, estado: 'ASISTIDO' },
      { id: 4, estado: 'CANCELADO' }
    ] as any;

    expect(component.totalDisponibles).toBe(1);
    expect(component.totalReservados).toBe(1);
    expect(component.totalAsistidos).toBe(1);
    expect(component.totalCancelados).toBe(1);

    component.filtroEstado = 'DISPONIBLE';
    expect(component.turnosFiltrados.length).toBe(1);
    expect(component.turnosFiltrados[0].id).toBe(1);

    component.filtroEstado = 'TODOS';
    expect(component.turnosFiltrados.length).toBe(4);
  });

  it('debe cerrar sesión e invocar authService.logout', () => {
    component.cerrarSesion();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
