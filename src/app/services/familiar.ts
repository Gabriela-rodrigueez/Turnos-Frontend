import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Familiar {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  obraSocialId?: number;
  obraSocialNombre?: string;
  tutorId?: number;
  tutorNombreCompleto?: string;
  isActive?: boolean;
  isActivo?: boolean;
  parentesco: string;
}

export interface FamiliarRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  telefono?: string;
  obraSocialId?: number;
  parentesco: string;
}

@Injectable({
  providedIn: 'root'
})
export class FamiliarService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/pacientes';

  /**
   * Obtiene la lista de familiares activos a cargo del paciente tutor
   */
  listarFamiliares(tutorId: number): Observable<Familiar[]> {
    return this.http.get<Familiar[]>(`${this.apiUrl}/${tutorId}/familiares`);
  }

  /**
   * Registra un nuevo familiar / dependiente bajo la tutela del paciente
   */
  registrarFamiliar(tutorId: number, request: FamiliarRequest): Observable<Familiar> {
    return this.http.post<Familiar>(`${this.apiUrl}/${tutorId}/familiares`, request);
  }

  /**
   * Realiza la baja lógica (isActivo = false) de un familiar a cargo
   */
  darDeBajaFamiliar(tutorId: number, familiarId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tutorId}/familiares/${familiarId}`);
  }

  /**
   * Reactiva un familiar previamente dado de baja
   */
  reactivarFamiliar(tutorId: number, familiarId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${tutorId}/familiares/${familiarId}/reactivar`, {});
  }

  /**
   * Calcula la edad en años a partir de una fecha de nacimiento (YYYY-MM-DD)
   */
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return Math.max(0, edad);
  }
}
