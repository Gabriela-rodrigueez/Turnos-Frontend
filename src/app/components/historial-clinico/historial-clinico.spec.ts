import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HistorialClinicoComponent } from './historial-clinico';
import { HistorialClinicoService, HistoriaClinicaResponse } from '../../services/historial-clinico';
import { AuthService } from '../../services/auth';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HistorialClinicoComponent', () => {
  let component: HistorialClinicoComponent;
  let fixture: ComponentFixture<HistorialClinicoComponent>;
  let historialServiceSpy: any;
  let authServiceSpy: any;

  const mockAtenciones: HistoriaClinicaResponse[] = [
    {
      id: 1,
      pacienteId: 1,
      pacienteNombreCompleto: 'Juan González',
      pacienteDni: '35111222',
      profesionalId: 10,
      profesionalNombreCompleto: 'Dr. Roberto Pérez',
      profesionalMatricula: 'M-12345',
      especialidadNombre: 'Cardiología',
      sedeNombre: 'Hospital Central',
      turnoId: 100,
      fechaAtencion: '2026-10-23T10:30:00',
      motivoConsulta: 'Dolor precordial',
      diagnostico: 'Hipertensión arterial controlada',
      tratamiento: 'Dieta y reposo',
      recetasPrescritas: 'Enalapril 10mg',
      estudiosSolicitados: 'ECG'
    },
    {
      id: 2,
      pacienteId: 1,
      pacienteNombreCompleto: 'Juan González',
      pacienteDni: '35111222',
      profesionalId: 12,
      profesionalNombreCompleto: 'Dra. María Gómez',
      profesionalMatricula: 'M-54321',
      especialidadNombre: 'Pediatría',
      sedeNombre: 'Hospital Notti',
      turnoId: 101,
      fechaAtencion: '2026-10-20T09:00:00',
      motivoConsulta: 'Fiebre alta',
      diagnostico: 'Faringitis viral',
      tratamiento: 'Paracetamol',
      recetasPrescritas: null,
      estudiosSolicitados: null
    }
  ];

  beforeEach(async () => {
    historialServiceSpy = {
      obtenerMiHistorial: vi.fn().mockReturnValue(of(mockAtenciones))
    };

    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getRol: vi.fn().mockReturnValue('PACIENTE'),
      currentUser: vi.fn().mockReturnValue({ pacienteId: 1, nombreCompleto: 'Juan González' })
    };

    await TestBed.configureTestingModule({
      imports: [HistorialClinicoComponent],
      providers: [
        provideRouter([]),
        { provide: HistorialClinicoService, useValue: historialServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialClinicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente y cargar el historial clínico', () => {
    expect(component).toBeTruthy();
    expect(historialServiceSpy.obtenerMiHistorial).toHaveBeenCalled();
    expect(component.historial.length).toBe(2);
    expect(component.cargando).toBe(false);
  });

  it('debe filtrar correctamente el historial por diagnóstico o médico', () => {
    component.filtroTexto = 'Cardiología';
    expect(component.historialFiltrado.length).toBe(1);
    expect(component.historialFiltrado[0].profesionalNombreCompleto).toContain('Roberto');

    component.filtroTexto = 'faringitis';
    expect(component.historialFiltrado.length).toBe(1);
    expect(component.historialFiltrado[0].diagnostico).toContain('Faringitis');

    component.filtroTexto = 'texto inexistente';
    expect(component.historialFiltrado.length).toBe(0);
  });

  it('debe gestionar error si la llamada al servicio falla', () => {
    historialServiceSpy.obtenerMiHistorial.mockReturnValue(throwError(() => new Error('Error de red')));
    component.cargarHistorial();

    expect(component.cargando).toBe(false);
    expect(component.mensajeError).toContain('No se pudo cargar');
    expect(component.historial.length).toBe(0);
  });
});
