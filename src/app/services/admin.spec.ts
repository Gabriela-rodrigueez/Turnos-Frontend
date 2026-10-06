import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin';
import { AuthService } from './auth';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe encontrar paciente empadronado por DNI (35111222)', () => {
    let pacienteRecibido: any = null;

    service.buscarPaciente('35111222').subscribe(p => {
      pacienteRecibido = p;
    });

    const req = httpMock.expectOne(r => r.url.includes('/api/v1/admin/pacientes/buscar'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('query')).toBe('35111222');
    expect(req.request.params.get('dni')).toBe('35111222');

    req.flush({
      id: 1,
      nombre: 'Juan',
      apellido: 'González',
      dni: '35111222',
      obraSocialNombre: 'OSEP Mendoza'
    });

    expect(pacienteRecibido).toBeTruthy();
    expect(pacienteRecibido.nombre).toBe('Juan');
    expect(pacienteRecibido.dni).toBe('35111222');
  });

  it('debe retornar null cuando el paciente no está empadronado', () => {
    let pacienteRecibido: any = 'placeholder';

    service.buscarPaciente('99999999').subscribe(p => {
      pacienteRecibido = p;
    });

    const reqBuscar = httpMock.expectOne(r => r.url.includes('/api/v1/admin/pacientes/buscar'));
    reqBuscar.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const reqFiltro = httpMock.expectOne(r => r.url.includes('/api/v1/admin/pacientes'));
    reqFiltro.flush([]);

    expect(pacienteRecibido).toBeNull();
  });

  it('debe avanzar el ticket del tótem al llamar al siguiente paciente', () => {
    const inicial = service.getTotemTicket();
    const siguiente = service.llamarSiguienteTicket();

    expect(siguiente.numero).not.toBe(inicial.numero);
    expect(siguiente.enEspera).toBeLessThanOrEqual(inicial.enEspera);
  });

  it('debe registrar y retornar paciente en alta rápida presencial', () => {
    let creado: any = null;
    const dto = {
      dni: '45888999',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      fechaNacimiento: '1998-07-22',
      sexo: 'Masculino',
      telefono: '261-5551234',
      obraSocialId: 1,
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: '1-45888999/01'
    };

    service.registrarPacientePresencial(dto).subscribe(res => {
      creado = res;
    });

    const req = httpMock.expectOne(r => r.url.includes('/api/v1/auth/registro'));
    req.flush({
      pacienteId: 777,
      email: '45888999@saludmza.gob.ar'
    });

    expect(creado).toBeTruthy();
    expect(creado.dni).toBe('45888999');
    expect(creado.nombre).toBe('Carlos');
  });
});
