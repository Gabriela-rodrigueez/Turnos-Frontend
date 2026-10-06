import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminComponent } from './admin';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { EspecialidadService } from '../../services/especialidad';
import { ProfesionalService } from '../../services/profesional';
import { SedeService } from '../../services/sede';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminServiceSpy: any;

  beforeEach(async () => {
    adminServiceSpy = {
      buscarPaciente: vi.fn(),
      obtenerTurnosPaciente: vi.fn().mockReturnValue(of([])),
      registrarPacientePresencial: vi.fn(),
      reservarTurnoPresencial: vi.fn(),
      getTotemTicket: vi.fn().mockReturnValue({
        numero: 'A-142',
        categoria: 'Atención General',
        horaEmision: '10:42',
        tiempoEsperaMin: 4,
        enEspera: 5
      }),
      llamarSiguienteTicket: vi.fn().mockReturnValue({
        numero: 'A-143',
        categoria: 'Atención General',
        horaEmision: '10:45',
        tiempoEsperaMin: 3,
        enEspera: 4
      }),
      getUltimasAdmisiones: vi.fn().mockReturnValue([])
    };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceSpy },
        AuthService,
        EspecialidadService,
        ProfesionalService,
        SedeService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el componente administrativo exitosamente', () => {
    expect(component).toBeTruthy();
    expect(component.sedeSeleccionada).toBe('Hospital Central de Mendoza');
    expect(component.ventanillaNombre).toContain('Ventanilla 3');
  });

  it('debe procesar paciente encontrado y renderizar la ficha en Paso 1', () => {
    const pacienteMock = {
      id: 1,
      nombre: 'Juan',
      apellido: 'González',
      dni: '35111222',
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: '1-35111222/01',
      alertasClinicas: ['Hipertensión Arterial']
    };
    adminServiceSpy.buscarPaciente.mockReturnValue(of(pacienteMock));

    component.searchQuery = '35111222';
    component.ejecutarBusqueda();

    expect(component.buscando).toBe(false);
    expect(component.pacienteSeleccionado).toEqual(pacienteMock);
    expect(component.noEmpadronado).toBe(false);
  });

  it('debe activar estado noEmpadronado cuando el DNI no existe en el registro', () => {
    adminServiceSpy.buscarPaciente.mockReturnValue(of(null));

    component.searchQuery = '99999999';
    component.ejecutarBusqueda();

    expect(component.buscando).toBe(false);
    expect(component.pacienteSeleccionado).toBeNull();
    expect(component.noEmpadronado).toBe(true);
  });

  it('debe abrir y cerrar el modal de alta rápida presencial', () => {
    component.abrirModalAlta('44111222');
    expect(component.modalAltaAbierto).toBe(true);
    expect(component.nuevoPaciente.dni).toBe('44111222');

    component.cerrarModalAlta();
    expect(component.modalAltaAbierto).toBe(false);
  });

  it('debe llamar al siguiente ticket del tótem', () => {
    component.llamarSiguienteTicket();
    expect(adminServiceSpy.llamarSiguienteTicket).toHaveBeenCalled();
    expect(component.totemTicket.numero).toBe('A-143');
  });
});
