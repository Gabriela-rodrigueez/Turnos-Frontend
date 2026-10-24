import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HistorialClinicoService, RegistrarAtencionRequest, HistoriaClinicaResponse } from './historial-clinico';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('HistorialClinicoService', () => {
  let service: HistorialClinicoService;
  let httpMock: HttpTestingController;

  const mockHistorial: HistoriaClinicaResponse[] = [
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
      motivoConsulta: 'Control de hipertensión',
      diagnostico: 'Hipertensión arterial grado 1',
      tratamiento: 'Dieta hiposódica y caminatas',
      recetasPrescritas: 'Enalapril 10mg',
      estudiosSolicitados: 'ECG'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistorialClinicoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HistorialClinicoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse el servicio exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('obtenerMiHistorial() debe enviar GET a /api/v1/historial-clinico/mi-historial', () => {
    service.obtenerMiHistorial().subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].diagnostico).toBe('Hipertensión arterial grado 1');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/historial-clinico/mi-historial');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistorial);
  });

  it('obtenerHistorialPorPaciente() debe enviar GET con pacienteId en la ruta', () => {
    service.obtenerHistorialPorPaciente(5).subscribe((data) => {
      expect(data).toEqual(mockHistorial);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/historial-clinico/paciente/5');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistorial);
  });

  it('obtenerDetalleRegistro() debe enviar GET con registroId en la ruta', () => {
    service.obtenerDetalleRegistro(1).subscribe((data) => {
      expect(data.id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/historial-clinico/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistorial[0]);
  });

  it('registrarAtencion() debe enviar POST a /api/v1/medico/consultas/{turnoId}/atender', () => {
    const payload: RegistrarAtencionRequest = {
      motivoConsulta: 'Dolor de cabeza',
      diagnostico: 'Cefalea tensional',
      tratamiento: 'Ibuprofeno 400mg'
    };

    service.registrarAtencion(100, payload).subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/medico/consultas/100/atender');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockHistorial[0]);
  });

  it('obtenerPacientes() debe enviar GET a /api/v1/pacientes con o sin filtro', () => {
    service.obtenerPacientes('35111222').subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/pacientes?filtro=35111222');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, nombre: 'Juan', apellido: 'González', dni: '35111222' }]);
  });
});
