import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenerarSlotsRequest {
  profesionalId: number;
  especialidadId: number;
  sedeId: number;
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string; // YYYY-MM-DD
  diasSemana?: string[]; // ['MONDAY', 'TUESDAY', ...]
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  duracionMinutos: number;
}

export interface GeneracionSlotsResponse {
  cantidadSlotsGenerados: number;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidadId: number;
  especialidadNombre: string;
  sedeId: number;
  sedeNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  slots: any[];
}

export interface TurnoAgenda {
  id: number;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  fechaHora?: string;
  fecha?: string;
  hora?: string;
  profesionalId?: number;
  profesionalNombre?: string;
  profesionalNombreCompleto?: string;
  especialidadId?: number;
  especialidadNombre?: string;
  sedeId?: number;
  sedeNombre?: string;
  estado: 'DISPONIBLE' | 'RESERVADO' | 'ASISTIDO' | 'CANCELADO';
  pacienteId?: number;
  pacienteNombreCompleto?: string;
  motivoConsulta?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private http = inject(HttpClient);
  private agendaApiUrl = 'http://localhost:8080/api/v1/agenda';
  private turnosApiUrl = 'http://localhost:8080/api/v1/turnos';

  /**
   * Genera slots masivos para la agenda del profesional
   */
  generarSlots(payload: GenerarSlotsRequest): Observable<GeneracionSlotsResponse> {
    return this.http.post<GeneracionSlotsResponse>(`${this.agendaApiUrl}/slots/generar`, payload);
  }

  /**
   * Da de baja un slot que se encuentre en estado DISPONIBLE
   */
  eliminarSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.agendaApiUrl}/slots/${id}`);
  }

  /**
   * Modifica el estado del turno (ej: ASISTIDO, CANCELADO, RESERVADO)
   */
  cambiarEstado(id: number, nuevoEstado: 'ASISTIDO' | 'CANCELADO' | 'RESERVADO', observaciones?: string): Observable<TurnoAgenda> {
    return this.http.patch<TurnoAgenda>(`${this.turnosApiUrl}/${id}/estado`, {
      estado: nuevoEstado,
      observaciones: observaciones || null
    });
  }

  /**
   * Obtiene los turnos para la agenda médica con filtros
   */
  obtenerTurnosAgenda(especialidadId?: number | null, profesionalId?: number | null, sedeId?: number | null, fecha?: string | null): Observable<TurnoAgenda[]> {
    let params = new HttpParams();
    if (especialidadId) params = params.set('especialidadId', especialidadId.toString());
    if (profesionalId) params = params.set('profesionalId', profesionalId.toString());
    if (sedeId) params = params.set('sedeId', sedeId.toString());
    if (fecha) params = params.set('fecha', fecha);

    return this.http.get<TurnoAgenda[]>(this.agendaApiUrl, { params });
  }

  /**
   * Consulta turnos en disponibilidad
   */
  obtenerDisponibilidad(especialidadId?: number | null, profesionalId?: number | null, sedeId?: number | null, fecha?: string | null): Observable<TurnoAgenda[]> {
    let params = new HttpParams();
    if (especialidadId) params = params.set('especialidadId', especialidadId.toString());
    if (profesionalId) params = params.set('profesionalId', profesionalId.toString());
    if (sedeId) params = params.set('sedeId', sedeId.toString());
    if (fecha) params = params.set('fecha', fecha);

    return this.http.get<TurnoAgenda[]>(`${this.turnosApiUrl}/disponibilidad`, { params });
  }
}
