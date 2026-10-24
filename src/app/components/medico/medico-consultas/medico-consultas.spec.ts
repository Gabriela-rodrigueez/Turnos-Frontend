import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MedicoConsultasComponent } from './medico-consultas';
import { HistorialClinicoService, PacienteItem, HistoriaClinicaResponse } from '../../../services/historial-clinico';
import { AuthService } from '../../../services/auth';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MedicoConsultasComponent', () => {
  let component: MedicoConsultasComponent;
  let fixture: ComponentFixture<MedicoConsultasComponent>;
  let historialServiceSpy: any;
  let authServiceSpy: any;

  const mockPacientes: PacienteItem[] = [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'González',
      dni: '35111222',
      email: 'juan@test.com',
      telefono: '261-400-1111',
      obraSocialNombre: 'OSEP Mendoza'
    },
    {
      id: 2,
      nombre: 'Lucía',
      apellido: 'Martínez',
      dni: '40222333',
      email: 'lucia@test.com',
      telefono: '261-400-2222',
      obraSocialNombre: 'Swiss Medical'
    }
  ];

  const mockHistorial: HistoriaClinicaResponse[] = [
    {
      id: 10,
      pacienteId: 1,
      pacienteNombreCompleto: 'Juan González',
      pacienteDni: '35111222',
      profesionalId: 2,
      profesionalNombreCompleto: 'Dr. Roberto Pérez',
      profesionalMatricula: 'M-12345',
      especialidadNombre: 'Cardiología',
      sedeNombre: 'Hospital Central',
      fechaAtencion: '2026-10-15T10:00:00',
      motivoConsulta: 'Dolor precordial',
      diagnostico: 'Hipertensión grado 1',
      tratamiento: 'Enalapril 10mg diario',
      recetasPrescritas: 'Enalapril 10mg',
      estudiosSolicitados: 'Electrocardiograma'
    }
  ];

  beforeEach(async () => {
    historialServiceSpy = {
      obtenerPacientes: vi.fn().mockReturnValue(of(mockPacientes)),
      obtenerHistorialPorPaciente: vi.fn().mockReturnValue(of(mockHistorial))
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(true),
      getRol: vi.fn().mockReturnValue('MEDICO'),
      currentUser: vi.fn().mockReturnValue({ usuarioId: 1, rol: 'MEDICO', nombreCompleto: 'Dr. Médico' })
    };

    await TestBed.configureTestingModule({
      imports: [MedicoConsultasComponent],
      providers: [
        provideRouter([]),
        { provide: HistorialClinicoService, useValue: historialServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicoConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente y cargar la lista de pacientes', () => {
    expect(component).toBeTruthy();
    expect(historialServiceSpy.obtenerPacientes).toHaveBeenCalledWith('');
    expect(component.pacientes.length).toBe(2);
    expect(component.cargandoPacientes).toBe(false);
  });

  it('debe filtrar pacientes por texto y permitir limpiar la búsqueda', () => {
    component.filtroBusqueda = '35111222';
    component.buscar();

    expect(historialServiceSpy.obtenerPacientes).toHaveBeenCalledWith('35111222');

    component.limpiarBusqueda();
    expect(component.filtroBusqueda).toBe('');
    expect(historialServiceSpy.obtenerPacientes).toHaveBeenCalledWith('');
  });

  it('debe abrir modal de historial clínico y consultar antecedentes del paciente seleccionado', () => {
    const paciente = mockPacientes[0];
    component.abrirHistorial(paciente);

    expect(component.modalHistorialAbierto).toBe(true);
    expect(component.pacienteSeleccionado).toEqual(paciente);
    expect(historialServiceSpy.obtenerHistorialPorPaciente).toHaveBeenCalledWith(1);
    expect(component.historialClinico.length).toBe(1);
    expect(component.cargandoHistorial).toBe(false);

    component.cerrarHistorial();
    expect(component.modalHistorialAbierto).toBe(false);
    expect(component.pacienteSeleccionado).toBeNull();
    expect(component.historialClinico.length).toBe(0);
  });

  it('debe gestionar errores al cargar pacientes', () => {
    historialServiceSpy.obtenerPacientes.mockReturnValue(throwError(() => ({ error: { message: 'Fallo de red' } })));
    component.cargarPacientes();

    expect(component.cargandoPacientes).toBe(false);
    expect(component.mensajeError).toBe('Fallo de red');
    expect(component.pacientes.length).toBe(0);
  });
});
