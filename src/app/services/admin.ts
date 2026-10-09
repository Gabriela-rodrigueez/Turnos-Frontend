import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { Paciente, ReservaPresencialRequestDTO, NuevoPacientePresencialDTO, TurnoHistorial, AdmisionItem, TotemTicket } from '../../models/admin.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly baseUrl = 'http://localhost:8080/api/v1';
  private readonly adminApiUrl = 'http://localhost:8080/api/v1/admin';

  // Base de datos local de respaldo para desarrollo offline y validación visual
  private pacientesMock: Paciente[] = [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'González',
      dni: '35111222',
      email: 'juan.gonzalez@gmail.com',
      telefono: '261-400-1111',
      fechaNacimiento: '1990-05-15',
      obraSocialId: 1,
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: '1-35111222/01',
      sexo: 'Masculino',
      alertasClinicas: ['Hipertensión Arterial (Crónico)', 'Alergia a Penicilina', 'Vacunación Antigripal 2026 Pendiente']
    },
    {
      id: 2,
      nombre: 'Lucía',
      apellido: 'Martínez',
      dni: '40222333',
      email: 'lucia.martinez@hotmail.com',
      telefono: '261-400-2222',
      fechaNacimiento: '1997-11-20',
      obraSocialId: 3,
      obraSocialNombre: 'Swiss Medical',
      numeroAfiliado: 'SM-40222333-A',
      sexo: 'Femenino',
      alertasClinicas: ['Diabetes Tipo 1', 'Control Ginecológico Anual al Día']
    },
    {
      id: 3,
      nombre: 'Mateo',
      apellido: 'González',
      dni: '55333444',
      email: 'tutor.juan@gmail.com',
      telefono: '261-400-1111',
      fechaNacimiento: '2018-08-10',
      obraSocialId: 1,
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: '1-35111222/02',
      sexo: 'Masculino',
      alertasClinicas: ['Control Pediátrico Escolar', 'Asma Leve'],
      tutorId: 1,
      tutorNombreCompleto: 'Juan González'
    }
  ];

  // Historial de turnos mock por paciente
  private turnosHistorialMock: Record<number, TurnoHistorial[]> = {
    1: [
      {
        id: 101,
        fecha: '18/09/2026',
        hora: '10:30',
        profesionalNombre: 'Dr. Roberto Pérez',
        especialidad: 'Cardiología',
        sede: 'Hospital Central de Mendoza',
        consultorio: 'Consultorio 12 - PB',
        estado: 'Atendido',
        motivoConsulta: 'Control de rutina e informe de ecocardiograma'
      },
      {
        id: 102,
        fecha: '05/10/2026',
        hora: '11:30',
        profesionalNombre: 'Dr. Roberto Pérez',
        especialidad: 'Cardiología',
        sede: 'Hospital Central de Mendoza',
        consultorio: 'Consultorio 12 - PB',
        estado: 'Confirmado',
        motivoConsulta: 'Control hipertensión arterial'
      },
      {
        id: 103,
        fecha: '20/10/2026',
        hora: '09:00',
        profesionalNombre: 'Dra. Silvina Morales',
        especialidad: 'Laboratorio Bioquímico',
        sede: 'Hospital Central de Mendoza',
        consultorio: 'Box 3 - Extracciones',
        estado: 'Pendiente',
        motivoConsulta: 'Perfil lipídico y glucemia en ayunas'
      }
    ],
    2: [
      {
        id: 104,
        fecha: '12/08/2026',
        hora: '15:00',
        profesionalNombre: 'Dra. María Gómez',
        especialidad: 'Clínica Médica',
        sede: 'Hospital Humberto Notti',
        consultorio: 'Consultorio 4',
        estado: 'Atendido',
        motivoConsulta: 'Chequeo anual laboral'
      }
    ]
  };

  // Monitor tótem en vivo
  private ticketActual: TotemTicket = {
    numero: 'A-142',
    categoria: 'Atención General y Turnos',
    horaEmision: '10:42',
    tiempoEsperaMin: 4,
    enEspera: 5
  };

  // Últimas admisiones en el puesto
  private ultimasAdmisiones: AdmisionItem[] = [
    {
      id: 501,
      codigoTurno: 'TRN-2026-9041',
      hora: '10:35',
      pacienteNombre: 'Roberto Sánchez',
      pacienteDni: '28.441.902',
      especialidad: 'Cardiología',
      profesional: 'Dr. Roberto Pérez',
      consultorio: 'Cons. 12',
      cobertura: 'OSEP Mendoza',
      numeroAfiliado: '1-28441902/00',
      tipoPractica: 'Consulta Especialidad',
      formatoEmision: 'Térmica (Ventanilla)',
      fechaHoraTurno: '08/10/2026 09:30 hs',
      ordenDerivacion: 'ORD-88214',
      operadorNombre: 'Lic. Mariana García'
    },
    {
      id: 502,
      codigoTurno: 'TRN-2026-9042',
      hora: '10:18',
      pacienteNombre: 'Elena Domínguez',
      pacienteDni: '33.109.843',
      especialidad: 'Traumatología',
      profesional: 'Dr. Carlos Rodríguez',
      consultorio: 'Cons. 8',
      cobertura: 'PAMI',
      numeroAfiliado: '190-33109843-02',
      tipoPractica: 'Sobreturno Protegido',
      formatoEmision: 'WhatsApp + Ticket',
      fechaHoraTurno: '07/10/2026 11:15 hs',
      ordenDerivacion: 'URG-7710',
      operadorNombre: 'Lic. Mariana García'
    },
    {
      id: 503,
      codigoTurno: 'TRN-2026-9043',
      hora: '09:50',
      pacienteNombre: 'Marcos Benítez',
      pacienteDni: '44.891.200',
      especialidad: 'Laboratorio',
      profesional: 'Bioq. Central',
      consultorio: 'Box 1',
      cobertura: 'Particular',
      numeroAfiliado: 'S/A',
      tipoPractica: 'Laboratorio Bioquímico',
      formatoEmision: 'Térmica (Ventanilla)',
      fechaHoraTurno: '09/10/2026 08:00 hs',
      operadorNombre: 'Lic. Mariana García'
    }
  ];

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  /**
   * Búsqueda de paciente por DNI o Apellido conectada a /api/v1/admin/pacientes/buscar?query={valor}
   * Envía tanto 'query' como 'dni' para máxima compatibilidad con el backend de Spring Boot.
   */
  buscarPaciente(query: string): Observable<Paciente | null> {
    const trimmed = query ? query.trim() : '';
    if (!trimmed) {
      return of(null);
    }

    const headers = this.getAuthHeaders();
    let params = new HttpParams().set('query', trimmed).set('dni', trimmed);

    return this.http.get<any>(`${this.adminApiUrl}/pacientes/buscar`, { params, headers }).pipe(
      map(res => this.normalizarPaciente(res)),
      catchError(err => {
        // Si el endpoint por DNI da 404 o falla, intentar búsqueda por filtro en listado
        return this.http.get<any[]>(`${this.adminApiUrl}/pacientes`, {
          params: new HttpParams().set('filtro', trimmed),
          headers
        }).pipe(
          map(lista => {
            if (Array.isArray(lista) && lista.length > 0) {
              return this.normalizarPaciente(lista[0]);
            }
            // Si la API tampoco lo encuentra, verificar en base mock local
            return this.buscarEnMock(trimmed);
          }),
          catchError(() => of(this.buscarEnMock(trimmed)))
        );
      })
    );
  }

  private buscarEnMock(query: string): Paciente | null {
    const q = query.toLowerCase().replace(/\./g, '').trim();
    const encontrado = this.pacientesMock.find(p =>
      p.dni.replace(/\./g, '') === q ||
      p.apellido.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(q)
    );
    return encontrado ? { ...encontrado } : null;
  }

  private normalizarPaciente(raw: any): Paciente {
    if (!raw) return null as any;
    return {
      id: raw.id,
      nombre: raw.nombre,
      apellido: raw.apellido,
      dni: raw.dni,
      email: raw.email || '',
      telefono: raw.telefono || 'Sin teléfono',
      fechaNacimiento: raw.fechaNacimiento,
      obraSocialId: raw.obraSocialId || (raw.obraSocial ? raw.obraSocial.id : 1),
      obraSocialNombre: raw.obraSocialNombre || (raw.obraSocial ? raw.obraSocial.nombre : 'Particular'),
      numeroAfiliado: raw.numeroAfiliado || `AF-${raw.dni}`,
      sexo: raw.sexo || 'No informado',
      alertasClinicas: raw.alertasClinicas || [
        'Empadronamiento SISA Mendoza',
        'Validación RENAPER biométrica OK'
      ],
      tutorId: raw.tutorId,
      tutorNombreCompleto: raw.tutorNombreCompleto
    };
  }

  /**
   * Obtiene los turnos previos y agendados del paciente
   */
  obtenerTurnosPaciente(pacienteId: number): Observable<TurnoHistorial[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.baseUrl}/pacientes/${pacienteId}/turnos`, { headers }).pipe(
      map(res => {
        if (!res || !Array.isArray(res) || res.length === 0) {
          return this.turnosHistorialMock[pacienteId] || [];
        }
        return res.map(r => ({
          id: r.id,
          fecha: r.fecha || (r.fechaHora ? r.fechaHora.split('T')[0] : 'Fecha a confirmar'),
          hora: r.hora || (r.fechaHora && r.fechaHora.includes('T') ? r.fechaHora.split('T')[1].substring(0, 5) : '--:--'),
          profesionalNombre: r.profesionalNombreCompleto || r.profesionalNombre || 'Profesional Asignado',
          especialidad: r.especialidadNombre || r.especialidad || 'Especialidad',
          sede: r.sedeNombre || r.sede || 'Hospital Central',
          consultorio: r.consultorio || 'Consultorio de Admisión',
          estado: r.estado === 'RESERVADO' ? 'Confirmado' : (r.estado === 'COMPLETADO' ? 'Atendido' : (r.estado || 'Confirmado')),
          motivoConsulta: r.motivoConsulta
        }));
      }),
      catchError(() => of(this.turnosHistorialMock[pacienteId] || []))
    );
  }

  /**
   * Alta rápida presencial de paciente nuevo sin cuenta digital
   */
  registrarPacientePresencial(dto: NuevoPacientePresencialDTO): Observable<Paciente> {
    const headers = this.getAuthHeaders();

    const requestBackend = {
      nombre: dto.nombre,
      apellido: dto.apellido,
      dni: dto.dni,
      email: dto.email || `${dto.dni}@saludmza.gob.ar`,
      password: 'Password123',
      telefono: dto.telefono,
      fechaNacimiento: dto.fechaNacimiento,
      obraSocialId: dto.obraSocialId || 1
    };

    return this.http.post<any>(`${this.baseUrl}/auth/registro`, requestBackend, { headers }).pipe(
      map(res => {
        const nuevo: Paciente = {
          id: res.pacienteId || res.usuarioId || Date.now(),
          nombre: dto.nombre,
          apellido: dto.apellido,
          dni: dto.dni,
          email: dto.email,
          telefono: dto.telefono,
          fechaNacimiento: dto.fechaNacimiento,
          sexo: dto.sexo,
          obraSocialId: dto.obraSocialId,
          obraSocialNombre: dto.obraSocialNombre || 'OSEP Mendoza',
          numeroAfiliado: dto.numeroAfiliado || `AF-${dto.dni}`,
          alertasClinicas: ['Alta Presencial Inmediata', 'Verificación de Identidad con DNI Físico']
        };
        this.pacientesMock.unshift(nuevo);
        return nuevo;
      }),
      catchError(() => {
        // En caso de que el backend no esté activo, registrar en memoria local
        const nuevo: Paciente = {
          id: Date.now(),
          nombre: dto.nombre,
          apellido: dto.apellido,
          dni: dto.dni,
          email: dto.email,
          telefono: dto.telefono,
          fechaNacimiento: dto.fechaNacimiento,
          sexo: dto.sexo,
          obraSocialId: dto.obraSocialId,
          obraSocialNombre: dto.obraSocialNombre || 'Particular',
          numeroAfiliado: dto.numeroAfiliado || `AF-${dto.dni}`,
          alertasClinicas: ['Alta Presencial Inmediata en Ventanilla 3', 'Documentación Validada']
        };
        this.pacientesMock.unshift(nuevo);
        return of(nuevo);
      })
    );
  }

  /**
   * Asignación de turno presencial administrativo
   * Invoca POST /api/v1/admin/turnos/reserva-presencial
   */
  reservarTurnoPresencial(request: ReservaPresencialRequestDTO, extraInfo?: {
    paciente: Paciente;
    especialidadNombre: string;
    profesionalNombre: string;
    sedeNombre: string;
    tipoPractica: string;
    formatoEmision: string;
    ordenDerivacion?: string;
  }): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(`${this.adminApiUrl}/turnos/reserva-presencial`, request, { headers }).pipe(
      tap(res => {
        this.registrarAdmisionLocal(res, request, extraInfo);
      }),
      catchError(err => {
        console.warn('Backend reserva-presencial no disponible, simulando emisión presencial:', err);
        const simulado = {
          id: Math.floor(Math.random() * 1000) + 100,
          fechaHora: request.fechaHora,
          estado: 'RESERVADO',
          pacienteId: request.pacienteId,
          profesionalId: request.profesionalId,
          especialidadId: request.especialidadId,
          sedeId: request.sedeId,
          codigoTurno: `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`
        };
        this.registrarAdmisionLocal(simulado, request, extraInfo);
        return of(simulado);
      })
    );
  }

  private registrarAdmisionLocal(turnoRes: any, request: ReservaPresencialRequestDTO, extraInfo?: any): void {
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const codigo = turnoRes.codigoTurno || `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const admision: AdmisionItem = {
      id: turnoRes.id || Date.now(),
      codigoTurno: codigo,
      hora: horaActual,
      pacienteNombre: extraInfo?.paciente ? `${extraInfo.paciente.nombre} ${extraInfo.paciente.apellido}` : 'Paciente',
      pacienteDni: extraInfo?.paciente?.dni || '',
      especialidad: extraInfo?.especialidadNombre || 'Especialidad',
      profesional: extraInfo?.profesionalNombre || 'Profesional Médico',
      consultorio: 'Cons. ' + (Math.floor(Math.random() * 14) + 1),
      cobertura: extraInfo?.paciente?.obraSocialNombre || 'Particular',
      numeroAfiliado: extraInfo?.paciente?.numeroAfiliado,
      tipoPractica: extraInfo?.tipoPractica || 'Consulta Especialidad',
      formatoEmision: extraInfo?.formatoEmision || 'Térmica (Ventanilla)',
      fechaHoraTurno: request.fechaHora.replace('T', ' ') + ' hs',
      ordenDerivacion: request.observaciones || extraInfo?.ordenDerivacion,
      operadorNombre: 'Lic. Mariana García'
    };

    this.ultimasAdmisiones.unshift(admision);
  }

  // Monitor tótem y fila
  getTotemTicket(): TotemTicket {
    return { ...this.ticketActual };
  }

  llamarSiguienteTicket(): TotemTicket {
    const prefix = this.ticketActual.numero.charAt(0);
    const num = parseInt(this.ticketActual.numero.slice(2), 10) + 1;
    this.ticketActual = {
      ...this.ticketActual,
      numero: `${prefix}-${num}`,
      horaEmision: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      enEspera: Math.max(0, this.ticketActual.enEspera - 1)
    };
    return { ...this.ticketActual };
  }

  getUltimasAdmisiones(): AdmisionItem[] {
    return [...this.ultimasAdmisiones];
  }
}
