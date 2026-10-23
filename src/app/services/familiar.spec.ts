import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FamiliarService, Familiar, FamiliarRequest } from './familiar';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FamiliarService', () => {
  let service: FamiliarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FamiliarService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(FamiliarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar familiares activos de un tutor', () => {
    let familiaresRecibidos: Familiar[] = [];

    service.listarFamiliares(1).subscribe(res => {
      familiaresRecibidos = res;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/pacientes/1/familiares');
    expect(req.request.method).toBe('GET');

    const mockFamiliares: Familiar[] = [
      {
        id: 2,
        nombre: 'Mateo',
        apellido: 'González',
        dni: '55333444',
        fechaNacimiento: '2016-04-10',
        parentesco: 'Hijo/a',
        obraSocialNombre: 'OSEP Mendoza',
        isActive: true
      }
    ];

    req.flush(mockFamiliares);

    expect(familiaresRecibidos.length).toBe(1);
    expect(familiaresRecibidos[0].nombre).toBe('Mateo');
    expect(familiaresRecibidos[0].parentesco).toBe('Hijo/a');
  });

  it('debe registrar un familiar a cargo exitosamente', () => {
    const nuevoFamiliarReq: FamiliarRequest = {
      nombre: 'Lucía',
      apellido: 'Martínez',
      dni: '56111222',
      fechaNacimiento: '2019-08-20',
      parentesco: 'Hijo/a',
      obraSocialId: 1
    };

    let familiarCreado: any = null;

    service.registrarFamiliar(1, nuevoFamiliarReq).subscribe(res => {
      familiarCreado = res;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/pacientes/1/familiares');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevoFamiliarReq);

    req.flush({
      id: 3,
      ...nuevoFamiliarReq,
      tutorId: 1,
      isActive: true,
      obraSocialNombre: 'OSEP Mendoza'
    });

    expect(familiarCreado).toBeTruthy();
    expect(familiarCreado?.id).toBe(3);
    expect(familiarCreado?.nombre).toBe('Lucía');
  });

  it('debe enviar DELETE para baja lógica del familiar', () => {
    let respondio = false;

    service.darDeBajaFamiliar(1, 2).subscribe(() => {
      respondio = true;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/pacientes/1/familiares/2');
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
    expect(respondio).toBe(true);
  });

  it('debe calcular correctamente la edad a partir de la fecha de nacimiento', () => {
    const nacimiento = new Date();
    nacimiento.setFullYear(nacimiento.getFullYear() - 8);
    const fechaIso = nacimiento.toISOString().split('T')[0];

    const edad = service.calcularEdad(fechaIso);
    expect(edad).toBe(8);
  });
});
