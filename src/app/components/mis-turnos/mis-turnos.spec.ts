import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisTurnosComponent } from './mis-turnos';
import { TurnoService } from '../../services/turno';
import { AuthService } from '../../services/auth';
import { FamiliarService } from '../../services/familiar';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MisTurnosComponent', () => {
  let component: MisTurnosComponent;
  let fixture: ComponentFixture<MisTurnosComponent>;
  let turnoServiceSpy: any;
  let familiarServiceSpy: any;
  let router: Router;
  let routerSpy: any;
  let authServiceSpy: any;

  const mockTurnosBackend = [
    {
      id: 3,
      fechaHora: '2026-10-05T11:30:00',
      estado: 'RESERVADO',
      pacienteId: 1,
      pacienteNombreCompleto: 'Juan González',
      profesionalId: 1,
      profesionalNombreCompleto: 'Roberto Pérez',
      especialidadId: 1,
      especialidadNombre: 'Cardiología',
      sedeId: 1,
      sedeNombre: 'Hospital Central de Mendoza',
      motivoConsulta: 'Control hipertensión arterial'
    }
  ];

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

  const mockTurnoFamiliar = [
    {
      id: 9,
      fechaHora: '2026-10-12T09:00:00',
      estado: 'RESERVADO',
      pacienteId: 2,
      pacienteNombreCompleto: 'Mateo González',
      profesionalId: 2,
      profesionalNombreCompleto: 'Ana Silva',
      especialidadId: 2,
      especialidadNombre: 'Pediatría',
      sedeId: 1,
      sedeNombre: 'Hospital Central de Mendoza',
      motivoConsulta: 'Control de rutina escolar'
    }
  ];

  beforeEach(async () => {
    turnoServiceSpy = {
      obtenerTurnosPaciente: vi.fn(),
      cancelarTurno: vi.fn()
    };
    familiarServiceSpy = {
      listarFamiliares: vi.fn().mockReturnValue(of(mockFamiliares))
    };
    authServiceSpy = {
      getPacienteId: vi.fn().mockReturnValue(1),
      hasRole: vi.fn().mockReturnValue(false),
      currentUser: vi.fn().mockReturnValue({ pacienteId: 1, rol: 'PACIENTE', nombreCompleto: 'Juan González' }),
      getRol: vi.fn().mockReturnValue('PACIENTE'),
      isAuthenticated: vi.fn().mockReturnValue(true),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MisTurnosComponent],
      providers: [
        provideRouter([]),
        { provide: TurnoService, useValue: turnoServiceSpy },
        { provide: FamiliarService, useValue: familiarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MisTurnosComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse el componente exitosamente', () => {
    turnoServiceSpy.obtenerTurnosPaciente.mockReturnValue(of(new HttpResponse({ body: [] })));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe cargar y agrupar turnos del titular y de los familiares activos', () => {
    turnoServiceSpy.obtenerTurnosPaciente.mockImplementation((id: number) => {
      if (id === 1) return of(new HttpResponse({ status: 200, body: mockTurnosBackend }));
      if (id === 2) return of(new HttpResponse({ status: 200, body: mockTurnoFamiliar }));
      return of(new HttpResponse({ status: 200, body: [] }));
    });

    fixture.detectChanges(); // Ejecuta ngOnInit y cargarTurnos

    expect(component.todosLosTurnos.length).toBe(2);
    expect(component.turnos.length).toBe(2);

    const turnoTitular = component.todosLosTurnos.find(t => t.id === 3);
    expect(turnoTitular?.esTitular).toBe(true);
    expect(turnoTitular?.beneficiarioParentesco).toBe('Titular');

    const turnoHijo = component.todosLosTurnos.find(t => t.id === 9);
    expect(turnoHijo?.esTitular).toBe(false);
    expect(turnoHijo?.beneficiarioNombre).toBe('Mateo González');
    expect(turnoHijo?.beneficiarioParentesco).toBe('Hijo/a');
  });

  it('debe filtrar turnos por pestaña de beneficiario', () => {
    turnoServiceSpy.obtenerTurnosPaciente.mockImplementation((id: number) => {
      if (id === 1) return of(new HttpResponse({ status: 200, body: mockTurnosBackend }));
      if (id === 2) return of(new HttpResponse({ status: 200, body: mockTurnoFamiliar }));
      return of(new HttpResponse({ status: 200, body: [] }));
    });

    fixture.detectChanges();

    // Filtro Titular
    component.seleccionarFiltro(1);
    expect(component.turnos.length).toBe(1);
    expect(component.turnos[0].id).toBe(3);

    // Filtro Mateo (Hijo)
    component.seleccionarFiltro(2);
    expect(component.turnos.length).toBe(1);
    expect(component.turnos[0].id).toBe(9);

    // Filtro Todos
    component.seleccionarFiltro('TODOS');
    expect(component.turnos.length).toBe(2);
  });

  it('debe solicitar confirmación y cancelar turno actualizando estado en la vista a CANCELADO', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    turnoServiceSpy.obtenerTurnosPaciente.mockReturnValue(
      of(new HttpResponse({ status: 200, body: mockTurnosBackend }))
    );
    turnoServiceSpy.cancelarTurno.mockReturnValue(of({ id: 3, estado: 'CANCELADO' }));

    fixture.detectChanges();

    const turno = component.turnos[0];
    component.solicitarCancelacion(turno);

    expect(window.confirm).toHaveBeenCalled();
    expect(turnoServiceSpy.cancelarTurno).toHaveBeenCalledWith(3);
    expect(turno.estado).toBe('CANCELADO');
    expect(component.mensajeExito).toContain('Roberto Pérez');
  });

  it('no debe cancelar el turno si el usuario cancela en la confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    turnoServiceSpy.obtenerTurnosPaciente.mockReturnValue(
      of(new HttpResponse({ status: 200, body: mockTurnosBackend }))
    );

    fixture.detectChanges();

    const turno = component.turnos[0];
    component.solicitarCancelacion(turno);

    expect(window.confirm).toHaveBeenCalled();
    expect(turnoServiceSpy.cancelarTurno).not.toHaveBeenCalled();
    expect(turno.estado).toBe('RESERVADO');
  });

  it('debe redirigir a /buscar al invocar irABuscarTurno', () => {
    component.irABuscarTurno();
    expect(routerSpy).toHaveBeenCalledWith(['/buscar']);
  });

  it('debe redirigir a /login-paciente si el usuario no está autenticado al inicializarse', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(false);
    component.ngOnInit();
    expect(routerSpy).toHaveBeenCalledWith(['/login-paciente']);
    expect(turnoServiceSpy.obtenerTurnosPaciente).not.toHaveBeenCalled();
  });
});
