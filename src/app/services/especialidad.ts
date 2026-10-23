import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/especialidades';

  getEspecialidades(profesionalId?: number | null): Observable<Especialidad[]> {
    let url = this.apiUrl;
    if (profesionalId) {
      url += `?profesionalId=${profesionalId}`;
    }
    return this.http.get<Especialidad[]>(url).pipe(
      catchError((err) => {
        console.error('Error al obtener especialidades:', err);
        return of([]);
      })
    );
  }
}
