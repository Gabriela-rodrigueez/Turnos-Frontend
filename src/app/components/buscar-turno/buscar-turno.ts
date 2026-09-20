import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, delay } from 'rxjs';

// Interfaces integradas para evitar errores de ruta en la compilación
export interface Especialidad { id: number; nombre: string; }
export interface Profesional { id: number; nombre: string; apellido: string; especialidadId: number; }
export interface Sede { id: number; nombre: string; }
export interface Turno { id: number; fechaHora: string; profesionalId: number; sedeId: number; estado: 'DISPONIBLE' | 'RESERVADO'; }

@Component({
  selector: 'app-buscar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-turno.html'
})
export class BuscarTurnoComponent implements OnInit {
  especialidades: Especialidad[] = [
    { id: 1, nombre: 'Cardiología' },
    { id: 2, nombre: 'Pediatría General' }
  ];

  profesionales: Profesional[] = [
    { id: 1, nombre: 'Ana', apellido: 'Silva', especialidadId: 2 },
    { id: 2, nombre: 'Carlos', apellido: 'Ruiz', especialidadId: 1 }
  ];

  sedes: Sede[] = [
    { id: 1, nombre: 'Hospital Central Mendoza' },
    { id: 2, nombre: 'CAPS N° 16 Godoy Cruz' }
  ];

  turnosDisponibles: Turno[] = [
    { id: 1, fechaHora: 'Mañana - 10:30 hs', profesionalId: 2, sedeId: 1, estado: 'DISPONIBLE' },
    { id: 2, fechaHora: 'Viernes - 15:00 hs', profesionalId: 1, sedeId: 2, estado: 'DISPONIBLE' }
  ];

  espSeleccionada: number | null = null;
  profSeleccionado: number | null = null;
  sedeSeleccionada: number | null = null;

  isLoading = false;
  busquedaRealizada = false;
  turnoConfirmado: Turno | null = null;

  ngOnInit(): void {}

  buscar() {
    if (!this.espSeleccionada) {
      alert('Seleccione una especialidad obligatoria');
      return;
    }
    this.isLoading = true;
    this.busquedaRealizada = true;
    this.turnoConfirmado = null;

    // Simulación de búsqueda con delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  confirmar(turno: Turno) {
    this.turnoConfirmado = turno;
  }
}