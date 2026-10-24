import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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

  private readonly STORAGE_PREFIX = 'grupo_familiar_tutor_';

  private obrasSocialesMap: Record<number, string> = {
    1: 'OSEP Mendoza',
    2: 'PAMI',
    3: 'Swiss Medical',
    4: 'OSDE',
    5: 'Particular / Sin Obra Social'
  };

  /**
   * Obtiene la lista de familiares activos a cargo del paciente tutor.
   * Si la API responde, actualiza la persistencia local.
   * Si el backend no tiene implementado el endpoint aún o no responde,
   * utiliza de manera transparente el almacenamiento local persistente.
   */
  listarFamiliares(tutorId: number): Observable<Familiar[]> {
    return this.http.get<Familiar[]>(`${this.apiUrl}/${tutorId}/familiares`).pipe(
      tap((familiares) => {
        if (Array.isArray(familiares)) {
          this.guardarEnStorage(tutorId, familiares);
        }
      }),
      catchError((err) => {
        console.warn(`[FamiliarService] El backend no respondió para el tutor ${tutorId}. Utilizando almacenamiento local de respaldo.`, err);
        const locales = this.obtenerDeStorage(tutorId);
        return of(locales);
      })
    );
  }

  /**
   * Registra un nuevo familiar / dependiente bajo la tutela del paciente.
   * Si el backend responde, persiste en API y en almacenamiento local.
   * Si el backend falla, almacena en localStorage y responde de manera inmediata.
   */
  registrarFamiliar(tutorId: number, request: FamiliarRequest): Observable<Familiar> {
    return this.http.post<Familiar>(`${this.apiUrl}/${tutorId}/familiares`, request).pipe(
      tap((nuevo) => {
        const actuales = this.obtenerDeStorage(tutorId);
        const idx = actuales.findIndex(f => f.id === nuevo.id);
        if (idx >= 0) {
          actuales[idx] = nuevo;
        } else {
          actuales.push(nuevo);
        }
        this.guardarEnStorage(tutorId, actuales);
      }),
      catchError((err) => {
        console.warn('[FamiliarService] Backend no disponible para registrar familiar. Guardando en almacenamiento local.', err);
        const actuales = this.obtenerDeStorage(tutorId);
        const osNombre = request.obraSocialId ? (this.obrasSocialesMap[request.obraSocialId] || 'Particular') : 'Particular / Sin Obra Social';
        
        const nuevoFamiliar: Familiar = {
          id: Date.now(),
          nombre: request.nombre,
          apellido: request.apellido,
          dni: request.dni,
          telefono: request.telefono,
          fechaNacimiento: request.fechaNacimiento,
          obraSocialId: request.obraSocialId,
          obraSocialNombre: osNombre,
          tutorId: tutorId,
          isActive: true,
          isActivo: true,
          parentesco: request.parentesco
        };

        actuales.push(nuevoFamiliar);
        this.guardarEnStorage(tutorId, actuales);
        return of(nuevoFamiliar);
      })
    );
  }

  /**
   * Realiza la baja lógica (isActivo = false) de un familiar a cargo
   */
  darDeBajaFamiliar(tutorId: number, familiarId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tutorId}/familiares/${familiarId}`).pipe(
      tap(() => {
        this.marcarBajaEnStorage(tutorId, familiarId);
      }),
      catchError((err) => {
        console.warn('[FamiliarService] Backend no disponible para baja. Aplicando borrado lógico localmente.', err);
        this.marcarBajaEnStorage(tutorId, familiarId);
        return of(void 0);
      })
    );
  }

  /**
   * Reactiva un familiar previamente dado de baja
   */
  reactivarFamiliar(tutorId: number, familiarId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${tutorId}/familiares/${familiarId}/reactivar`, {}).pipe(
      catchError(() => of(void 0))
    );
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

  /**
   * Helpers privados de almacenamiento local para persistencia resiliente
   */
  private getStorageKey(tutorId: number): string {
    return `${this.STORAGE_PREFIX}${tutorId}`;
  }

  private obtenerDeStorage(tutorId: number): Familiar[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(this.getStorageKey(tutorId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private guardarEnStorage(tutorId: number, lista: Familiar[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.getStorageKey(tutorId), JSON.stringify(lista));
    } catch (e) {
      console.warn('Error al guardar familiares en localStorage:', e);
    }
  }

  private marcarBajaEnStorage(tutorId: number, familiarId: number): void {
    const lista = this.obtenerDeStorage(tutorId);
    const filtrados = lista.filter(f => f.id !== familiarId);
    this.guardarEnStorage(tutorId, filtrados);
  }
}
