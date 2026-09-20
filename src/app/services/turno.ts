import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// Moviendo las interfaces aquí para asegurar el éxito de la compilación
export interface Especialidad { id: number; nombre: string; }
export interface Profesional { id: number; nombre: string; apellido: string; especialidadId: number; }
export interface Sede { id: number; nombre: string; }
export interface Turno { id: number; fechaHora: string; profesionalId: number; sedeId: number; estado: 'DISPONIBLE' | 'RESERVADO'; }

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
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

  private turnos: Turno[] = [
    { id: 1, fechaHora: 'Mañana - 10:30 hs', profesionalId: 2, sedeId: 1, estado: 'DISPONIBLE' },
    { id: 2, fechaHora: 'Viernes - 15:00 hs', profesionalId: 1, sedeId: 2, estado: 'DISPONIBLE' }
  ];

  getEspecialidades(): Observable<Especialidad[]> { return of(this.especialidades).pipe(delay(300)); }
  getProfesionales(): Observable<Profesional[]> { return of(this.profesionales).pipe(delay(300)); }
  getSedes(): Observable<Sede[]> { return of(this.sedes).pipe(delay(300)); }
  
  buscarTurnos(especialidadId: number, profesionalId?: number, sedeId?: number): Observable<Turno[]> {
    let resultados = this.turnos;
    if (profesionalId) resultados = resultados.filter(t => t.profesionalId === profesionalId);
    if (sedeId) resultados = resultados.filter(t => t.sedeId === sedeId);
    return of(resultados).pipe(delay(1500)); 
  }
}