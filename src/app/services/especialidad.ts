import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface EspecialidadPayload {
  nombre: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/especialidades';
  private adminApiUrl = 'http://localhost:8080/api/v1/admin/especialidades';

  /**
   * Obtiene el listado general de especialidades médicas (público o filtrado por profesional)
   */
  getEspecialidades(profesionalId?: number | null): Observable<Especialidad[]> {
    let url = this.apiUrl;
    if (profesionalId) {
      url += `?profesionalId=${profesionalId}`;
    }
    return this.http.get<Especialidad[]>(url).pipe(
      map(res => res ?? []),
      catchError((err) => {
        console.error('Error al obtener especialidades:', err);
        return of([]);
      })
    );
  }

  /**
   * Da de alta una nueva especialidad médica (Exclusivo Administrador)
   * POST /api/v1/admin/especialidades
   */
  crearEspecialidad(payload: EspecialidadPayload): Observable<Especialidad> {
    return this.http.post<Especialidad>(this.adminApiUrl, payload);
  }

  /**
   * Actualiza el nombre y/o descripción clínica de una especialidad (Exclusivo Administrador)
   * PUT /api/v1/admin/especialidades/{id}
   */
  actualizarEspecialidad(id: number, payload: EspecialidadPayload): Observable<Especialidad> {
    return this.http.put<Especialidad>(`${this.adminApiUrl}/${id}`, payload);
  }

  /**
   * Obtiene el detalle de una especialidad por su ID
   * GET /api/v1/admin/especialidades/{id}
   */
  getEspecialidadPorId(id: number): Observable<Especialidad> {
    return this.http.get<Especialidad>(`${this.adminApiUrl}/${id}`);
  }
}
