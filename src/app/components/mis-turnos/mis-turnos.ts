import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { TurnoService } from '../../services/turno';

export interface TurnoPaciente {
  id: number;
  fecha: string;
  hora: string;
  profesionalNombre: string;
  especialidad: string;
  sede: string;
  estado: 'RESERVADO' | 'CANCELADO' | 'COMPLETADO' | string;
}

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.css']
})
export class MisTurnosComponent implements OnInit {

  turnos: TurnoPaciente[] = [];
  cargando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';
  pacienteId: number = 1; // ID de prueba para desarrollo

  constructor(
    private turnoService: TurnoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    this.turnoService.obtenerTurnosPaciente(this.pacienteId).subscribe({
      next: (response: HttpResponse<any[]>) => {
        this.cargando = false;
        // Respuesta 204 No Content o arreglo vacío
        if (response.status === 204 || !response.body || response.body.length === 0) {
          this.turnos = [];
        } else {
          this.turnos = response.body;
        }
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudieron recuperar los turnos. Intente más tarde.';
        console.error(err);
      }
    });
  }

  solicitarCancelacion(turno: TurnoPaciente): void {
    const confirmacion = window.confirm(
      `¿Está seguro de que desea cancelar el turno con ${turno.profesionalNombre} (${turno.especialidad}) el ${turno.fecha} a las ${turno.hora} hs?`
    );

    if (!confirmacion) return;

    this.cargando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    this.turnoService.cancelarTurno(turno.id).subscribe({
      next: () => {
        this.cargando = false;
        turno.estado = 'CANCELADO'; // Actualización inmediata en UI
        this.mensajeExito = `El turno con ${turno.profesionalNombre} fue cancelado exitosamente.`;
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = 'Error al procesar la cancelación. Verifique la conexión con el servidor.';
        console.error(err);
      }
    });
  }

  irABuscarTurno(): void {
    this.router.navigate(['/']); // Redirección al buscador
  }
}