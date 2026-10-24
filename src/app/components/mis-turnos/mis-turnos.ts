import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TurnoService } from '../../services/turno';
import { AuthService } from '../../services/auth';
import { HistorialClinicoService, PacienteItem } from '../../services/historial-clinico';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.css']
})
export class MisTurnosComponent implements OnInit {

  turnos: TurnoPaciente[] = [];
  cargando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';
  pacienteId: number = 1;

  // Estado para rol Administrador / Mesa de Entrada
  esAdmin: boolean = false;
  busquedaPaciente: string = '';
  buscandoPacientes: boolean = false;
  pacientesSugeridos: PacienteItem[] = [];
  pacienteSeleccionado: PacienteItem | null = null;
  haBuscadoPacientes: boolean = false;
  errorBusqueda: string = '';

  public authService = inject(AuthService);
  public router = inject(Router);
  private turnoService = inject(TurnoService);
  private historialService = inject(HistorialClinicoService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-paciente']);
      return;
    }

    if (this.authService.hasRole(['MEDICO'])) {
      this.router.navigate(['/agenda']);
      return;
    }

    this.esAdmin = this.authService.hasRole(['ADMINISTRADOR', 'ADMIN']);

    if (this.esAdmin) {
      // Si es administrador o mesa de entrada, no consultamos turnos automáticamente:
      // se espera a que busque y seleccione un paciente primero.
      this.turnos = [];
      return;
    }

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
    let horaFin = '';

    // Si viene fechaHoraInicio o fechaHora
    const fechaHoraVal = raw.fechaHoraInicio || raw.fechaHora;
    if (fechaHoraVal) {
      const fechaHoraStr = fechaHoraVal.toString().replace(' ', 'T');
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

    if (raw.fechaHoraFin) {
      const fechaFinStr = raw.fechaHoraFin.toString().replace(' ', 'T');
      const partesFin = fechaFinStr.split('T');
      if (partesFin.length >= 2 && partesFin[1]) {
        horaFin = partesFin[1].substring(0, 5);
      }
    }

    const horarioCompleto = horaFin ? `${hora} - ${horaFin}` : hora;

    return {
      id: raw.id,
      fecha: fecha || 'A confirmar',
      hora: horarioCompleto || '--:--',
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

  buscarPacientes(): void {
    if (!this.busquedaPaciente || !this.busquedaPaciente.trim()) {
      this.errorBusqueda = 'Por favor ingrese al menos un criterio de búsqueda (DNI, nombre o apellido).';
      return;
    }

    this.buscandoPacientes = true;
    this.errorBusqueda = '';
    this.haBuscadoPacientes = true;

    this.historialService.obtenerPacientes(this.busquedaPaciente.trim()).subscribe({
      next: (pacientes) => {
        this.buscandoPacientes = false;
        this.pacientesSugeridos = pacientes || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.buscandoPacientes = false;
        this.errorBusqueda = 'Error al consultar pacientes. Intente nuevamente.';
        console.error('Error al buscar pacientes', err);
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarPaciente(paciente: PacienteItem): void {
    this.pacienteSeleccionado = paciente;
    this.pacienteId = paciente.id;
    this.pacientesSugeridos = [];
    this.errorBusqueda = '';
    this.cargarTurnos();
  }

  cambiarPaciente(id?: number): void {
    if (id !== undefined) {
      this.pacienteId = id;
      this.cargarTurnos();
      return;
    }
    this.pacienteSeleccionado = null;
    this.turnos = [];
    this.mensajeExito = '';
    this.errorMensaje = '';
    this.pacientesSugeridos = [];
    this.haBuscadoPacientes = false;
    this.busquedaPaciente = '';
    this.errorBusqueda = '';
    this.cdr.detectChanges();
  }

  irABuscarTurno(): void {
    this.router.navigate(['/buscar']); // Redirección al buscador principal de turnos
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}