import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TurnoService } from '../../services/turno';
import { AuthService } from '../../services/auth';

export interface TurnoPaciente {
  id: number;
  fecha: string;
  hora: string;
  profesionalNombre: string;
  especialidad: string;
  sede: string;
  estado: 'RESERVADO' | 'CANCELADO' | 'COMPLETADO' | string;
  motivoConsulta?: string;
}

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.css']
})
export class MisTurnosComponent implements OnInit {

  turnos: TurnoPaciente[] = [];
  cargando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';
  pacienteId: number = 1;

  private authService = inject(AuthService);

  constructor(
    private turnoService: TurnoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const dynamicPacienteId = this.authService.getPacienteId();
    if (dynamicPacienteId) {
      this.pacienteId = dynamicPacienteId;
    }
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    this.turnoService.obtenerTurnosPaciente(this.pacienteId).subscribe({
      next: (response: any) => {
        this.cargando = false;

        // Se extrae el body del HttpResponse
        const data = (response && response.body !== undefined) ? response.body : response;

        // Respuesta 204 No Content o arreglo vacío
        if (!data || (Array.isArray(data) && data.length === 0)) {
          this.turnos = [];
        } else if (Array.isArray(data)) {
          // Mapeo seguro de los atributos de TurnoResponseDTO del backend a TurnoPaciente
          this.turnos = data.map((raw: any) => this.mapearTurno(raw));
        } else {
          this.turnos = [];
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudieron recuperar los turnos. Intente más tarde.';
        console.error('Error al cargar los turnos', err);
        this.cdr.detectChanges();
      }
    });
  }

  private mapearTurno(raw: any): TurnoPaciente {
    let fecha = raw.fecha || '';
    let hora = raw.hora || '';

    // Si viene fechaHora en formato ISO (ej: 2026-10-05T11:30:00 o 2026-10-05 11:30:00)
    if (raw.fechaHora) {
      const fechaHoraStr = raw.fechaHora.toString().replace(' ', 'T');
      const partes = fechaHoraStr.split('T');
      if (partes.length >= 1 && partes[0]) {
        const dateParts = partes[0].split('-');
        if (dateParts.length === 3) {
          fecha = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          fecha = partes[0];
        }
      }
      if (partes.length >= 2 && partes[1]) {
        hora = partes[1].substring(0, 5);
      }
    }

    return {
      id: raw.id,
      fecha: fecha || 'A confirmar',
      hora: hora || '--:--',
      profesionalNombre: raw.profesionalNombreCompleto || raw.profesionalNombre || 'Profesional no especificado',
      especialidad: raw.especialidadNombre || raw.especialidad || 'Especialidad general',
      sede: raw.sedeNombre || raw.sede || 'Sede no especificada',
      estado: raw.estado || 'RESERVADO',
      motivoConsulta: raw.motivoConsulta || ''
    };
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = 'Error al procesar la cancelación. Verifique la conexión con el servidor.';
        console.error('Error al cancelar turno', err);
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPaciente(id: number): void {
    if (this.authService.hasRole(['PACIENTE'])) {
      const myId = this.authService.getPacienteId();
      this.pacienteId = myId ? myId : this.pacienteId;
    } else {
      this.pacienteId = id;
    }
    this.cargarTurnos();
  }

  irABuscarTurno(): void {
    this.router.navigate(['/']); // Redirección al buscador principal
  }
}