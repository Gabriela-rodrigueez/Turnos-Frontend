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

  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Error al obtener especialidades:', err);
        return of([]);
      })
    );
  }
}
