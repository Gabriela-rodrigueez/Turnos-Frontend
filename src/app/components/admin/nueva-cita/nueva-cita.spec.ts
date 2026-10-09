import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NuevaCitaComponent } from './nueva-cita';
import { AdminService } from '../../../services/admin';
import { AuthService } from '../../../services/auth';
import { EspecialidadService } from '../../../services/especialidad';
import { ProfesionalService } from '../../../services/profesional';
import { SedeService } from '../../../services/sede';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NuevaCitaComponent', () => {
  let component: NuevaCitaComponent;
  let fixture: ComponentFixture<NuevaCitaComponent>;
  let adminServiceSpy: any;

  beforeEach(async () => {
    adminServiceSpy = {
      buscarPaciente: vi.fn(),
      obtenerTurnosPaciente: vi.fn().mockReturnValue(of([])),
      registrarPacientePresencial: vi.fn(),
      reservarTurnoPresencial: vi.fn(),
      getTotemTicket: vi.fn().mockReturnValue({
        numero: 'A-108',
        categoria: 'Atención General',
        horaEmision: '10:42',
        tiempoEsperaMin: 3,
        enEspera: 4
      }),
      llamarSiguienteTicket: vi.fn().mockReturnValue({
        numero: 'A-109',
        categoria: 'Atención General',
        horaEmision: '10:45',
        tiempoEsperaMin: 2,
        enEspera: 3
      }),
      getUltimasAdmisiones: vi.fn().mockReturnValue([])
    };

    await TestBed.configureTestingModule({
      imports: [NuevaCitaComponent],
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
    fixture = TestBed.createComponent(NuevaCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse NuevaCitaComponent exitosamente con Ventanilla 3', () => {
    expect(component).toBeTruthy();
    expect(component.ventanillaNombre).toContain('Ventanilla 3');
  });

  it('debe validar paciente en padrón y poblar Paso 1', () => {
    const pacienteMock = {
      id: 1,
      nombre: 'Juan Manuel',
      apellido: 'Vargas',
      dni: '35111222',
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: '1-35111222/01',
      alertasClinicas: ['Hipertensión']
    };
    adminServiceSpy.buscarPaciente.mockReturnValue(of(pacienteMock));

    component.dniBusqueda = '35111222';
    component.validarEnPadron();

    expect(component.pacienteSeleccionado).toEqual(pacienteMock);
    expect(component.noEmpadronado).toBe(false);
  });

  it('debe marcar noEmpadronado cuando el paciente no existe en el padrón', () => {
    adminServiceSpy.buscarPaciente.mockReturnValue(of(null));

    component.dniBusqueda = '99999999';
    component.validarEnPadron();

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
    expect(component.totemTicket.numero).toBe('A-109');
  });

  it('debe cambiar el tipo de práctica médica y actualizar consultorio asignado', () => {
    component.seleccionarTipoPractica('LABORATORIO');
    expect(component.tipoPractica).toBe('LABORATORIO');
    expect(component.consultorioAsignado).toContain('Box 3');

    component.seleccionarTipoPractica('IMAGENES');
    expect(component.tipoPractica).toBe('IMAGENES');
    expect(component.consultorioAsignado).toContain('Sala Rx 2');
  });
});

