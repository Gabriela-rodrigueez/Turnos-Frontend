import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgendaService, GenerarSlotsRequest } from './agenda';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('AgendaService', () => {
  let service: AgendaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AgendaService]
    });
    service = TestBed.inject(AgendaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe enviar POST a /api/v1/agenda/slots/generar al generar slots', () => {
    const payload: GenerarSlotsRequest = {
      profesionalId: 1,
      especialidadId: 1,
      sedeId: 1,
      fechaDesde: '2026-11-01',
      fechaHasta: '2026-11-05',
      horaInicio: '08:00',
      horaFin: '12:00',
      duracionMinutos: 30
    };

    const mockResponse: any = {
      cantidadSlotsGenerados: 8,
      profesionalId: 1
    };

    service.generarSlots(payload).subscribe(res => {
      expect(res.cantidadSlotsGenerados).toBe(8);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/agenda/slots/generar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('debe enviar DELETE a /api/v1/agenda/slots/{id} al eliminar slot libre', () => {
    service.eliminarSlot(15).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/agenda/slots/15');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('debe enviar PATCH a /api/v1/turnos/{id}/estado al cambiar estado a ASISTIDO', () => {
    service.cambiarEstado(10, 'ASISTIDO', 'Paciente atendido').subscribe(res => {
      expect(res.estado).toBe('ASISTIDO');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/turnos/10/estado');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'ASISTIDO', observaciones: 'Paciente atendido' });
    req.flush({ id: 10, estado: 'ASISTIDO' });
  });
});
