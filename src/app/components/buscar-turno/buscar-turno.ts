import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, delay } from 'rxjs';

// Interfaces integradas 
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

  turnosDisponibles: Turno[] = [];

  espSeleccionada: number | null = null;
  profSeleccionado: number | null = null;
  sedeSeleccionada: number | null = null;
  fechaSeleccionada: string | null = null;
  isLoading = false;
  busquedaRealizada = false;
  turnoConfirmado: Turno | null = null;

  ngOnInit(): void {}

  buscar() {
    if (!this.espSeleccionada) {
      alert('Seleccione una especialidad obligatoria');
      return;
    }

    // Activa la pantalla de carga
    this.isLoading = true;
    this.busquedaRealizada = true;
    this.turnoConfirmado = null;

    // Simulacion de búsqueda
    setTimeout(() => {
      
      // 1. Definimos 3 fechas que tienen turnos libres 
      const fechasConTurno = ['2026-09-28', '2026-09-29', '2026-09-30'];

      // 2. Comprobar si el usuario seleccionó una fecha y si esa fecha está en nuestra lista
      if (this.fechaSeleccionada && fechasConTurno.includes(this.fechaSeleccionada)) {
        
        // Si eligió el 28, 29 o 30 de septiembre, armamos los turnos con esa misma fecha
        this.turnosDisponibles = [
          { id: 1, fechaHora: `${this.fechaSeleccionada} - 10:30 hs`, profesionalId: 1, sedeId: 1, estado: 'DISPONIBLE' },
          { id: 2, fechaHora: `${this.fechaSeleccionada} - 15:00 hs`, profesionalId: 2, sedeId: 2, estado: 'DISPONIBLE' }
        ];

      } else {
        
        // Si no puso fecha, o si puso cualquier otra fecha, la lista queda vacía (aparece el mensaje)
        this.turnosDisponibles = []; 

      }
      
      this.isLoading = false; 
    }, 400);
  }
}