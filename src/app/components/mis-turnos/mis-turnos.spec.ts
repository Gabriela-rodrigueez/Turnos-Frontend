import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MisTurnosComponent } from './mis-turnos';
import { TurnoService } from '../../services/turno';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

describe('MisTurnosComponent', () => {
  let component: MisTurnosComponent;
  let fixture: ComponentFixture<MisTurnosComponent>;
  let turnoServiceSpy: jasmine.SpyObj<TurnoService>;
  let routerSpy: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    turnoServiceSpy = jasmine.createSpyObj('TurnoService', ['obtenerTurnosPaciente', 'cancelarTurno']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MisTurnosComponent],
      providers: [
        { provide: TurnoService, useValue: turnoServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MisTurnosComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse el componente exitosamente', () => {
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(of(new HttpResponse({ body: [] })));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe cargar y mapear correctamente los turnos desde la API (200 OK)', () => {
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(
      of(new HttpResponse({ status: 200, body: mockTurnosBackend }))
    );

    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component.turnos.length).toBe(1);
    const turno = component.turnos[0];
    expect(turno.id).toBe(3);
    expect(turno.profesionalNombre).toBe('Roberto Pérez');
    expect(turno.especialidad).toBe('Cardiología');
    expect(turno.sede).toBe('Hospital Central de Mendoza');
    expect(turno.fecha).toBe('05/10/2026');
    expect(turno.hora).toBe('11:30');
    expect(turno.estado).toBe('RESERVADO');
    expect(component.cargando).toBeFalse();
  });

  it('debe manejar respuesta 204 No Content dejando la lista vacía', () => {
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(
      of(new HttpResponse({ status: 204, body: null }))
    );

    fixture.detectChanges();

    expect(component.turnos.length).toBe(0);
    expect(component.cargando).toBeFalse();
    expect(component.errorMensaje).toBe('');
  });

  it('debe solicitar confirmación y cancelar turno actualizando estado en la vista a CANCELADO', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(
      of(new HttpResponse({ status: 200, body: mockTurnosBackend }))
    );
    turnoServiceSpy.cancelarTurno.and.returnValue(of({ id: 3, estado: 'CANCELADO' }));

    fixture.detectChanges();

    const turno = component.turnos[0];
    component.solicitarCancelacion(turno);

    expect(window.confirm).toHaveBeenCalled();
    expect(turnoServiceSpy.cancelarTurno).toHaveBeenCalledWith(3);
    expect(turno.estado).toBe('CANCELADO');
    expect(component.mensajeExito).toContain('Roberto Pérez');
  });

  it('no debe cancelar el turno si el usuario cancela en la confirmación', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(
      of(new HttpResponse({ status: 200, body: mockTurnosBackend }))
    );

    fixture.detectChanges();

    const turno = component.turnos[0];
    component.solicitarCancelacion(turno);

    expect(window.confirm).toHaveBeenCalled();
    expect(turnoServiceSpy.cancelarTurno).not.toHaveBeenCalled();
    expect(turno.estado).toBe('RESERVADO');
  });

  it('debe mostrar mensaje de error si falla la llamada al servicio', () => {
    turnoServiceSpy.obtenerTurnosPaciente.and.returnValue(
      throwError(() => new Error('Error de red'))
    );

    fixture.detectChanges();

    expect(component.turnos.length).toBe(0);
    expect(component.cargando).toBeFalse();
    expect(component.errorMensaje).toContain('No se pudieron recuperar los turnos');
  });

  it('debe redirigir a / al invocar irABuscarTurno', () => {
    component.irABuscarTurno();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
