import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Sede {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/sedes';

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Error al obtener sedes:', err);
        return of([]);
      })
    );
  }
}
