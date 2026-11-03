import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EspecialidadService, Especialidad, EspecialidadPayload } from './especialidad';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('EspecialidadService', () => {
  let service: EspecialidadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EspecialidadService]
    });
    service = TestBed.inject(EspecialidadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe enviar GET a /api/v1/especialidades para obtener todas las especialidades', () => {
    const mockEspecialidades: Especialidad[] = [
      { id: 1, nombre: 'Cardiología', descripcion: 'Corazón' },
      { id: 2, nombre: 'Pediatría', descripcion: 'Niños' }
    ];

    service.getEspecialidades().subscribe(res => {
      expect(res.length).toBe(2);
      expect(res).toEqual(mockEspecialidades);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/especialidades');
    expect(req.request.method).toBe('GET');
    req.flush(mockEspecialidades);
  });

  it('debe enviar GET a /api/v1/especialidades con profesionalId cuando se provee', () => {
    service.getEspecialidades(5).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/especialidades?profesionalId=5');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('debe retornar arreglo vacío si falla la petición getEspecialidades', () => {
    service.getEspecialidades().subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/especialidades');
    req.error(new ProgressEvent('error'));
  });

  it('debe enviar POST a /api/v1/admin/especialidades al dar de alta una especialidad', () => {
    const payload: EspecialidadPayload = {
      nombre: 'Neurología',
      descripcion: 'Enfermedades del sistema nervioso'
    };

    const mockResponse: Especialidad = {
      id: 10,
      nombre: 'Neurología',
      descripcion: 'Enfermedades del sistema nervioso'
    };

    service.crearEspecialidad(payload).subscribe(res => {
      expect(res.id).toBe(10);
      expect(res.nombre).toBe('Neurología');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/especialidades');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('debe enviar PUT a /api/v1/admin/especialidades/{id} al actualizar una especialidad', () => {
    const payload: EspecialidadPayload = {
      nombre: 'Cardiología Pediátrica',
      descripcion: 'Atención cardíaca infantil'
    };

    const mockResponse: Especialidad = {
      id: 1,
      nombre: 'Cardiología Pediátrica',
      descripcion: 'Atención cardíaca infantil'
    };

    service.actualizarEspecialidad(1, payload).subscribe(res => {
      expect(res.nombre).toBe('Cardiología Pediátrica');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/especialidades/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('debe enviar GET a /api/v1/admin/especialidades/{id} al consultar por ID', () => {
    const mockResponse: Especialidad = {
      id: 2,
      nombre: 'Pediatría',
      descripcion: 'Atención pediátrica'
    };

    service.getEspecialidadPorId(2).subscribe(res => {
      expect(res.id).toBe(2);
      expect(res.nombre).toBe('Pediatría');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/especialidades/2');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});

