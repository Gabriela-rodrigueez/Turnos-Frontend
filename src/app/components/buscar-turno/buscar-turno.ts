import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EspecialidadService, Especialidad } from '../../services/especialidad';
import { SedeService, Sede } from '../../services/sede';
import { ProfesionalService, Profesional } from '../../services/profesional';

export interface Turno {
  id: number;
  fechaHora?: string;
  fecha?: string;
  hora?: string;
  profesionalId?: number;
  profesionalNombre?: string;
  profesionalNombreCompleto?: string;
  sedeId?: number;
  sedeNombre?: string;
  especialidadId?: number;
  especialidadNombre?: string;
  estado?: 'DISPONIBLE' | 'RESERVADO';
  [key: string]: any;
}

@Component({
  selector: 'app-buscar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-turno.html'
})
export class BuscarTurnoComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  private especialidadService = inject(EspecialidadService);
  private sedeService = inject(SedeService);
  private profesionalService = inject(ProfesionalService);
  
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
  turnoConfirmado: Turno | null = null;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
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

  // 1. Llamada real para consultar disponibilidad
  buscar(): void {
    if (!this.espSeleccionada) {
      alert('Seleccione una especialidad obligatoria');
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

  // 2. Llamada real para confirmar y reservar el turno
  confirmar(turno: any): void {
    this.isLoading = true;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.cdr.detectChanges();

    console.log('Turno presionado:', turno);

    const fechaBase = (turno.fechaHora || turno.fecha_hora || '2026-10-05T16:00:00').toString();
    const fechaHoraValida = fechaBase.includes('T') ? fechaBase.split('T')[0] + 'T16:00:00' : '2026-10-05T16:00:00';

    const body = {
      pacienteId: 1,
      profesionalId: Number(turno.profesionalId || turno.profesional_id || 1),
      especialidadId: Number(turno.especialidadId || turno.especialidad_id || this.espSeleccionada || 1),
      sedeId: Number(turno.sedeId || turno.sede_id || 1),
      fechaHora: fechaHoraValida,
      motivoConsulta: 'Consulta médica general'
    };

    console.log('Enviando payload de reserva:', JSON.stringify(body));

    this.http.post<any>(`${this.apiUrl}/reserva`, body).subscribe({
      next: (respuesta) => {
        console.log('Reserva confirmada con éxito:', respuesta);
        this.isLoading = false;
        this.turnoConfirmado = { ...turno, fechaHora: fechaHoraValida };
        this.mensajeExito = '¡Turno reservado exitosamente!';
        turno.estado = 'RESERVADO';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error del backend al reservar:', err);
        this.isLoading = false;
        if (err.status === 409 || err.status === 400) {
          this.mensajeError =
            err.error?.message ||
            'El turno seleccionado ya fue reservado o posee un conflicto de horario.';
        } else {
          this.mensajeError =
            'No se pudo completar la reserva. Verifique la conexión con el servidor.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  reiniciarBusqueda(): void {
    this.turnoConfirmado = null;
    this.busquedaRealizada = false;
    this.mensajeError = null;
    this.mensajeExito = null;
    this.turnosDisponibles = [];
    this.cdr.detectChanges();
  }
}