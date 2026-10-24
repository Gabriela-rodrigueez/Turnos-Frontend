import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PacienteItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  obraSocialNombre?: string;
}

export interface RegistrarAtencionRequest {
  motivoConsulta: string;
  diagnostico: string;
  tratamiento?: string;
  recetasPrescritas?: string;
  estudiosSolicitados?: string;
}

export interface HistoriaClinicaResponse {
  id: number;
  pacienteId: number;
  pacienteNombreCompleto: string;
  pacienteDni: string;
  profesionalId: number;
  profesionalNombreCompleto: string;
  profesionalMatricula: string;
  especialidadNombre?: string | null;
  sedeNombre?: string | null;
  turnoId?: number | null;
  fechaAtencion: string;
  motivoConsulta: string;
  diagnostico: string;
  tratamiento?: string | null;
  recetasPrescritas?: string | null;
  estudiosSolicitados?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialClinicoService {
  private http = inject(HttpClient);
  private apiHistorialUrl = 'http://localhost:8080/api/v1/historial-clinico';
  private apiMedicoUrl = 'http://localhost:8080/api/v1/medico/consultas';
  private apiPacientesUrl = 'http://localhost:8080/api/v1/pacientes';

  /**
   * Obtiene el listado de pacientes registrados, con soporte para filtrar por DNI, nombre o apellido.
   */
  obtenerPacientes(filtro?: string): Observable<PacienteItem[]> {
    let params = new HttpParams();
    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<PacienteItem[]>(this.apiPacientesUrl, { params });
  }

  /**
   * Obtiene el historial clínico propio del paciente en sesión (solo lectura).
   */
  obtenerMiHistorial(): Observable<HistoriaClinicaResponse[]> {
    return this.http.get<HistoriaClinicaResponse[]>(`${this.apiHistorialUrl}/mi-historial`);
  }

  /**
   * Obtiene el historial clínico completo de un paciente por su ID (para médicos y administradores).
   */
  obtenerHistorialPorPaciente(pacienteId: number): Observable<HistoriaClinicaResponse[]> {
    return this.http.get<HistoriaClinicaResponse[]>(`${this.apiHistorialUrl}/paciente/${pacienteId}`);
  }

  /**
   * Alias de obtenerHistorialPorPaciente para conveniencia.
   */
  obtenerHistorialPaciente(pacienteId: number): Observable<HistoriaClinicaResponse[]> {
    return this.obtenerHistorialPorPaciente(pacienteId);
  }

  /**
   * Obtiene el detalle de un registro específico de atención médica.
   */
  obtenerDetalleRegistro(registroId: number): Observable<HistoriaClinicaResponse> {
    return this.http.get<HistoriaClinicaResponse>(`${this.apiHistorialUrl}/${registroId}`);
  }

  /**
   * Registra la atención médica y notas de evolución clínica de un turno reservado.
   */
  registrarAtencion(turnoId: number, datos: RegistrarAtencionRequest): Observable<HistoriaClinicaResponse> {
    return this.http.post<HistoriaClinicaResponse>(`${this.apiMedicoUrl}/${turnoId}/atender`, datos);
  }
}
