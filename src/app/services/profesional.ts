import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Especialidad } from './especialidad';

export interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  matricula?: string;
  email?: string;
  telefono?: string;
  especialidades?: Especialidad[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfesionalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/profesionales';

  getProfesionales(especialidadId?: number | null, sedeId?: number | null): Observable<Profesional[]> {
    let params = new HttpParams();
    if (especialidadId) {
      params = params.set('especialidadId', especialidadId.toString());
    }
    if (sedeId) {
      params = params.set('sedeId', sedeId.toString());
    }

    return this.http.get<Profesional[]>(this.apiUrl, { params }).pipe(
      catchError((err) => {
        console.error('Error al obtener profesionales:', err);
        return of([]);
      })
    );
  }
}
