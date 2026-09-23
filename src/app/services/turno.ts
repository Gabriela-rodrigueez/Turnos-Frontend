import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface Especialidad { id: number; nombre: string; }
export interface Profesional { id: number; nombre: string; apellido: string; especialidadId: number; }
export interface Sede { id: number; nombre: string; }

export interface Turno {
  id: number;
  fechaHora: string;
  profesionalId?: number;
  sedeId?: number;
  estado?: 'DISPONIBLE' | 'RESERVADO';
  [key: string]: any;
}

export interface ReservaTurnoRequestDTO {
  turnoId: number;
  pacienteId?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/turnos';

  // Catálogos auxiliares (se mantienen de soporte local hasta tener endpoints de catálogos)
  private especialidades: Especialidad[] = [
    { id: 1, nombre: 'Cardiología' },
    { id: 2, nombre: 'Pediatría General' }
  ];

  private profesionales: Profesional[] = [
    { id: 1, nombre: 'Ana', apellido: 'Silva', especialidadId: 2 },
    { id: 2, nombre: 'Carlos', apellido: 'Ruiz', especialidadId: 1 }
  ];

  private sedes: Sede[] = [
    { id: 1, nombre: 'Hospital Central Mendoza' },
    { id: 2, nombre: 'CAPS N° 16 Godoy Cruz' }
  ];

  getEspecialidades(): Observable<Especialidad[]> { 
    return of(this.especialidades).pipe(delay(200)); 
  }

  getProfesionales(): Observable<Profesional[]> { 
    return of(this.profesionales).pipe(delay(200)); 
  }

  getSedes(): Observable<Sede[]> { 
    return of(this.sedes).pipe(delay(200)); 
  }

  // 1. Llamada real a la API para consultar disponibilidad
  buscarTurnos(especialidadId: number, profesionalId?: number, sedeId?: number): Observable<Turno[]> {
    let params = new HttpParams().set('especialidadId', especialidadId.toString());

    if (profesionalId) {
      params = params.set('profesionalId', profesionalId.toString());
    }
    if (sedeId) {
      params = params.set('sedeId', sedeId.toString());
    }

    return this.http.get<Turno[]>(`${this.apiUrl}/disponibilidad`, { params });
  }

  // 2. Llamada real para reservar turno
  reservarTurno(payload: ReservaTurnoRequestDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reserva`, payload);
  }

  // 3. Llamada real para cancelar turno
  cancelarTurno(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}