import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EspecialidadService, Especialidad } from '../../services/especialidad';
import { SedeService, Sede } from '../../services/sede';
import { ProfesionalService, Profesional } from '../../services/profesional';
import { AuthService } from '../../services/auth';

export interface Turno {
  id: number;
  fechaHora?: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  fecha?: string;
  hora?: string;
  profesionalId?: number;
  profesionalNombre?: string;
  profesionalNombreCompleto?: string;
  sedeId?: number;
  sedeNombre?: string;
  sede?: any;
  especialidadId?: number;
  especialidadNombre?: string;
  especialidad?: any;
  motivoConsulta?: string;
  estado?: 'DISPONIBLE' | 'RESERVADO';
  [key: string]: any;
}

@Component({
  selector: 'app-buscar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './buscar-turno.html'
})
export class BuscarTurnoComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public router = inject(Router);
  
  private especialidadService = inject(EspecialidadService);
  private sedeService = inject(SedeService);
  private profesionalService = inject(ProfesionalService);
  public authService = inject(AuthService);
  
  private apiUrl = 'http://localhost:8080/api/v1/turnos';

  // Catálogos dinámicos cargados desde la API
  especialidades: Especialidad[] = [];
  profesionales: Profesional[] = [];
  sedes: Sede[] = [];

  turnosDisponibles: Turno[] = [];

  espSeleccionada: number | null = null;
  profSeleccionado: number | null = null;
  sedeSeleccionada: number | null = null;

  isLoading = false;
  isCatalogLoading = false;
  busquedaRealizada = false;
  turnoSeleccionado: Turno | null = null;
  motivoConsulta = '';
  turnoConfirmado: Turno | null = null;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    if (this.authService.hasRole(['MEDICO'])) {
      this.router.navigate(['/agenda']);
      return;
    }
    this.cargarCatalogos();
  }

  // Carga inicial de catálogos desde el backend
  cargarCatalogos(): void {
    this.isCatalogLoading = true;
    
    this.especialidadService.getEspecialidades().subscribe((esps) => {
      this.especialidades = esps || [];
      this.cdr.detectChanges();
    });

    this.sedeService.getSedes().subscribe((sedes) => {
      this.sedes = sedes || [];
      this.cdr.detectChanges();
    });

    this.cargarProfesionales();
  }

  // Filtrado dinámico de profesionales según especialidad y sede seleccionadas
  cargarProfesionales(): void {
    this.profesionalService.getProfesionales(this.espSeleccionada, this.sedeSeleccionada).subscribe((profs) => {
      this.profesionales = profs || [];
      // Si el profesional previamente seleccionado ya no pertenece a la lista filtrada, resetear
      if (this.profSeleccionado && !this.profesionales.some((p) => p.id === this.profSeleccionado)) {
        this.profSeleccionado = null;
      }
      this.isCatalogLoading = false;
      this.cdr.detectChanges();
    });
  }

  onEspecialidadChange(): void {
    this.cargarProfesionales();
  }

  onSedeChange(): void {
    this.cargarProfesionales();
  }

  // 1. Llamada real para consultar disponibilidad (Especialidad obligatoria)
  buscar(): void {
    if (!this.espSeleccionada) {
      this.mensajeError = 'Por favor, seleccione una especialidad médica obligatoria para realizar la búsqueda.';
      this.busquedaRealizada = false;
      this.turnosDisponibles = [];
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.busquedaRealizada = true;
    this.turnoConfirmado = null;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.turnosDisponibles = [];
    this.cdr.detectChanges();

    let params = new HttpParams().set('especialidadId', this.espSeleccionada.toString());
    if (this.profSeleccionado) {
      params = params.set('profesionalId', this.profSeleccionado.toString());
    }
    if (this.sedeSeleccionada) {
      params = params.set('sedeId', this.sedeSeleccionada.toString());
    }

    this.http.get<Turno[]>(`${this.apiUrl}/disponibilidad`, { params }).subscribe({
      next: (turnos) => {
        console.log('Turnos devueltos por el backend:', turnos);
        this.turnosDisponibles = turnos || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar disponibilidad:', err);
        this.isLoading = false;
        this.mensajeError =
          err.error?.message ||
          (err.status === 0
            ? 'No se pudo conectar con el servidor (verificar CORS o backend).'
            : 'Ocurrió un error al consultar la disponibilidad.');
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarTurno(turno: Turno): void {
    this.turnoSeleccionado = turno;
    this.motivoConsulta = '';
    this.mensajeError = null;
    this.cdr.detectChanges();
  }

  cancelarSeleccion(): void {
    this.turnoSeleccionado = null;
    this.motivoConsulta = '';
    this.mensajeError = null;
    this.cdr.detectChanges();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.turnoSeleccionado && !this.isLoading) {
      this.cancelarSeleccion();
    }
  }

  // 2. Llamada real para confirmar y reservar el turno sobre slot preexistente
  confirmar(turno: any): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-paciente']);
      return;
    }

    this.isLoading = true;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.cdr.detectChanges();

    console.log('Turno presionado para reserva en firme:', turno);

    const fechaSlot = turno.fechaHoraInicio || turno.fechaHora || turno.fecha_hora;
    const motivo = this.motivoConsulta?.trim() || null;

    const body = {
      turnoId: turno.id,
      pacienteId: this.authService.getPacienteId() || 1,
      profesionalId: Number(turno.profesionalId || turno.profesional_id || 1),
      especialidadId: Number(turno.especialidadId || turno.especialidad_id || this.espSeleccionada || 1),
      sedeId: Number(turno.sedeId || turno.sede_id || 1),
      fechaHora: fechaSlot,
      motivoConsulta: motivo
    };

    console.log('Enviando payload de reserva con slot DISPONIBLE:', JSON.stringify(body));

    this.http.post<any>(`${this.apiUrl}/reserva`, body).subscribe({
      next: (respuesta) => {
        console.log('Reserva confirmada con éxito:', respuesta);
        this.isLoading = false;
        this.turnoConfirmado = { ...turno, ...respuesta, fechaHora: fechaSlot, motivoConsulta: motivo || respuesta?.motivoConsulta };
        this.turnoSeleccionado = null;
        this.mensajeExito = '¡Turno reservado exitosamente!';
        turno.estado = 'RESERVADO';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error del backend al reservar:', err);
        this.isLoading = false;
        if (err.status === 409 || err.status === 400) {
          let detalleValidacion = '';
          if (err.error?.detalles && typeof err.error.detalles === 'object') {
            detalleValidacion = Object.values(err.error.detalles).join('. ');
          }
          this.mensajeError =
            detalleValidacion ||
            err.error?.message ||
            'El turno seleccionado ya no se encuentra disponible o ha expirado.';
        } else {
          this.mensajeError =
            'No se pudo completar la reserva. Verifique la conexión con el servidor.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  get fechaConfirmadaFormateada(): string {
    if (!this.turnoConfirmado) return '';
    const fechaRaw = this.turnoConfirmado.fechaHoraInicio || this.turnoConfirmado.fechaHora || this.turnoConfirmado.fecha;
    if (!fechaRaw) return '';
    try {
      const fechaLimpia = fechaRaw.toString().trim().replace(' ', 'T');
      const partes = fechaLimpia.split('T')[0].split('-');
      if (partes.length === 3) {
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        const d = new Date(anio, mes, dia);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaPad = String(dia).padStart(2, '0');
        const mesPad = String(mes + 1).padStart(2, '0');
        return `${diasSemana[d.getDay()]} ${diaPad} de ${meses[mes]} de ${anio} (${diaPad}/${mesPad}/${anio})`;
      }
      return fechaRaw;
    } catch {
      return fechaRaw;
    }
  }

  get horaConfirmadaFormateada(): string {
    if (!this.turnoConfirmado) return '';
    const extraerHora = (str?: string): string => {
      if (!str) return '';
      const s = str.toString().trim().replace(' ', 'T');
      if (s.includes('T')) {
        const h = s.split('T')[1];
        return h.length >= 5 ? h.substring(0, 5) : h;
      }
      if (s.includes(':')) {
        return s.length >= 5 ? s.substring(0, 5) : s;
      }
      return s;
    };

    const horaIni = extraerHora(this.turnoConfirmado.fechaHoraInicio || this.turnoConfirmado.fechaHora || this.turnoConfirmado.hora);
    const horaFin = extraerHora(this.turnoConfirmado.fechaHoraFin);

    if (horaIni && horaFin && horaIni !== horaFin) {
      return `${horaIni} - ${horaFin} hs`;
    }
    if (horaIni) {
      return `${horaIni} hs`;
    }
    return '';
  }

  reiniciarBusqueda(): void {
    this.turnoConfirmado = null;
    this.turnoSeleccionado = null;
    this.motivoConsulta = '';
    this.busquedaRealizada = false;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.turnosDisponibles = [];
    this.cdr.detectChanges();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}