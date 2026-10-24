import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AgendaService, TurnoAgenda, GenerarSlotsRequest } from '../../../services/agenda';
import { EspecialidadService, Especialidad } from '../../../services/especialidad';
import { ProfesionalService, Profesional } from '../../../services/profesional';
import { SedeService, Sede } from '../../../services/sede';
import { AuthService } from '../../../services/auth';
import { HistorialClinicoService, HistoriaClinicaResponse, RegistrarAtencionRequest } from '../../../services/historial-clinico';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agenda.html',
  styleUrls: ['./agenda.css']
})
export class AgendaComponent implements OnInit {
  private agendaService = inject(AgendaService);
  private especialidadService = inject(EspecialidadService);
  private profesionalService = inject(ProfesionalService);
  private sedeService = inject(SedeService);
  public authService = inject(AuthService);
  private historialClinicoService = inject(HistorialClinicoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Catálogos
  especialidades: Especialidad[] = [];
  profesionales: Profesional[] = [];
  sedes: Sede[] = [];

  // Filtros de pantalla
  especialidadSeleccionada: number | null = null;
  profesionalSeleccionado: number | null = null;
  sedeSeleccionada: number | null = null;
  fechaSeleccionada: string = '';
  filtroEstado: string = 'TODOS';

  // Estado del usuario
  esMedico: boolean = false;
  nombreMedicoFijo: string = '';

  // Lista de turnos y estados UI
  turnos: TurnoAgenda[] = [];
  cargando: boolean = false;
  cargandoGeneracion: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Modal para Generación Masiva de Slots
  modalGenerarAbierto: boolean = false;
  genEspecialidadId: number | null = null;
  genProfesionalId: number | null = null;
  profesionalesModal: Profesional[] = [];
  genFechaDesde: string = '';
  genFechaHasta: string = '';
  genHoraInicio: string = '08:00';
  genHoraFin: string = '12:00';
  genDuracionMinutos: number = 30;
  genSedeId: number | null = null;
  genModalError: string = '';

  // Días de atención seleccionables
  diasSemana = [
    { key: 'MONDAY', label: 'Lunes', selected: true },
    { key: 'TUESDAY', label: 'Martes', selected: true },
    { key: 'WEDNESDAY', label: 'Miércoles', selected: true },
    { key: 'THURSDAY', label: 'Jueves', selected: true },
    { key: 'FRIDAY', label: 'Viernes', selected: true },
    { key: 'SATURDAY', label: 'Sábado', selected: false }
  ];

  // Modal de Atención Médica (Issue F-11)
  modalAtencionAbierto: boolean = false;
  turnoAtencion: TurnoAgenda | null = null;
  atencionMotivo: string = '';
  atencionDiagnostico: string = '';
  atencionTratamiento: string = '';
  atencionRecetas: string = '';
  atencionEstudios: string = '';
  atencionError: string = '';
  atencionGuardando: boolean = false;

  // Modal de Consulta de Historial Clínico de Pacientes (Issue F-11)
  modalHistorialPrevioAbierto: boolean = false;
  pacienteHistorialNombre: string = '';
  historialPrevio: HistoriaClinicaResponse[] = [];
  cargandoHistorialPrevio: boolean = false;
  errorHistorialPrevio: string = '';

  ngOnInit(): void {
    this.detectarRolUsuario();
    this.cargarCatalogos();
  }

  detectarRolUsuario(): void {
    this.esMedico = this.authService.hasRole(['MEDICO']);
    if (this.esMedico) {
      const user = this.authService.currentUser();
      this.profesionalSeleccionado = user?.profesionalId || 1;
      this.nombreMedicoFijo = user?.nombreCompleto || 'Profesional Médico';
    }
  }

  cargarCatalogos(): void {
    const profId = this.esMedico ? this.profesionalSeleccionado : null;
    this.especialidadService.getEspecialidades(profId).subscribe({
      next: (data) => {
        this.especialidades = data || [];
        // Si el usuario es médico y posee especialidades, autoseleccionamos su especialidad
        if (this.esMedico && this.especialidades.length > 0 && !this.especialidadSeleccionada) {
          this.especialidadSeleccionada = this.especialidades[0].id;
          this.cargarAgenda();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar especialidades', err)
    });

    this.sedeService.getSedes().subscribe({
      next: (data) => {
        this.sedes = data || [];
        if (this.sedes.length > 0) {
          this.genSedeId = this.sedes[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar sedes', err)
    });

    // Para administradores, precargamos la nómina de profesionales y la agenda completa
    if (!this.esMedico) {
      this.profesionalService.getProfesionales().subscribe({
        next: (data) => {
          this.profesionales = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar profesionales', err)
      });
      this.cargarAgenda();
    }
  }

  onEspecialidadChange(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.esMedico) {
      this.profesionalService.getProfesionales(this.especialidadSeleccionada, this.sedeSeleccionada).subscribe({
        next: (data) => {
          this.profesionales = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar profesionales', err)
      });
    }

    this.cargarAgenda();
  }

  cargarAgenda(limpiarMensajes: boolean = true): void {
    this.cargando = true;
    this.mensajeError = '';
    if (limpiarMensajes) {
      this.mensajeExito = '';
    }

    // Consultamos la agenda médica completa con filtros opcionales
    this.agendaService.obtenerTurnosAgenda(
      this.especialidadSeleccionada,
      this.profesionalSeleccionado,
      this.sedeSeleccionada,
      this.fechaSeleccionada || null
    ).subscribe({
      next: (data) => {
        this.cargando = false;
        this.turnos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la agenda médica. Verifique la conexión con el servidor.';
        console.error('Error al consultar agenda', err);
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalGenerar(): void {
    this.mensajeError = '';
    const hoy = new Date();
    const dentroDe15Dias = new Date();
    dentroDe15Dias.setDate(hoy.getDate() + 15);

    this.genFechaDesde = hoy.toISOString().split('T')[0];
    this.genFechaHasta = dentroDe15Dias.toISOString().split('T')[0];
    this.genHoraInicio = '08:00';
    this.genHoraFin = '12:00';
    this.genDuracionMinutos = 30;
    this.genModalError = '';

    // Si ya hay especialidad seleccionada la usamos, sino asignamos la primera del catálogo
    if (this.especialidadSeleccionada) {
      this.genEspecialidadId = this.especialidadSeleccionada;
    } else if (this.especialidades.length > 0) {
      this.genEspecialidadId = this.especialidades[0].id;
    }

    if (this.esMedico) {
      this.genProfesionalId = this.profesionalSeleccionado;
    } else {
      this.genProfesionalId = this.profesionalSeleccionado || null;
      this.actualizarProfesionalesModal();
    }

    if (!this.genSedeId && this.sedes.length > 0) {
      this.genSedeId = this.sedes[0].id;
    }

    this.modalGenerarAbierto = true;
  }

  onGenEspecialidadChange(): void {
    this.genProfesionalId = null;
    this.actualizarProfesionalesModal();
  }

  actualizarProfesionalesModal(): void {
    if (!this.genEspecialidadId) {
      this.profesionalesModal = [];
      return;
    }
    this.profesionalService.getProfesionales(this.genEspecialidadId, this.genSedeId).subscribe({
      next: (data) => {
        this.profesionalesModal = data || [];
        if (this.profesionalesModal.length > 0 && !this.genProfesionalId) {
          this.genProfesionalId = this.profesionalesModal[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar profesionales para modal', err)
    });
  }

  cerrarModalGenerar(): void {
    this.modalGenerarAbierto = false;
    this.genModalError = '';
  }

  generarSlots(): void {
    this.genModalError = '';

    const espId = this.genEspecialidadId || this.especialidadSeleccionada;
    const profId = this.esMedico ? this.profesionalSeleccionado : (this.genProfesionalId || this.profesionalSeleccionado);

    if (!espId) {
      this.genModalError = 'Seleccione la especialidad médica.';
      return;
    }
    if (!profId) {
      this.genModalError = 'Seleccione el profesional médico al que se le generará la agenda.';
      return;
    }
    if (!this.genSedeId) {
      this.genModalError = 'Seleccione la sede hospitalaria.';
      return;
    }
    if (!this.genFechaDesde || !this.genFechaHasta) {
      this.genModalError = 'Ingrese las fechas de inicio y fin.';
      return;
    }
    if (this.genFechaDesde > this.genFechaHasta) {
      this.genModalError = 'La fecha de inicio no puede ser posterior a la fecha final.';
      return;
    }
    if (this.genHoraInicio >= this.genHoraFin) {
      this.genModalError = 'La hora de fin debe ser estrictamente posterior a la hora de inicio.';
      return;
    }

    const diasActivos = this.diasSemana.filter(d => d.selected).map(d => d.key);
    if (diasActivos.length === 0) {
      this.genModalError = 'Debe seleccionar al menos un día de atención de la semana.';
      return;
    }

    const payload: GenerarSlotsRequest = {
      profesionalId: profId,
      especialidadId: espId,
      sedeId: this.genSedeId,
      fechaDesde: this.genFechaDesde,
      fechaHasta: this.genFechaHasta,
      diasSemana: diasActivos,
      horaInicio: this.genHoraInicio,
      horaFin: this.genHoraFin,
      duracionMinutos: Number(this.genDuracionMinutos)
    };

    this.cargandoGeneracion = true;

    this.agendaService.generarSlots(payload).subscribe({
      next: (res) => {
        this.cargandoGeneracion = false;
        this.modalGenerarAbierto = false;
        this.mensajeExito = `¡Se generaron con éxito ${res.cantidadSlotsGenerados} slots de turnos en estado DISPONIBLE!`;
        this.especialidadSeleccionada = espId;
        this.profesionalSeleccionado = profId;
        this.cargarAgenda(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoGeneracion = false;
        if (err.status === 409) {
          this.genModalError = err.error?.message || 'Conflicto de solapamiento: El profesional ya posee turnos o slots en ese rango de horarios.';
        } else {
          this.genModalError = err.error?.message || 'Error al generar los slots en el servidor.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  eliminarSlot(turno: TurnoAgenda): void {
    const confirmacion = window.confirm(
      `¿Desea eliminar el slot libre de las ${turno.hora || turno.fechaHoraInicio} hs?`
    );
    if (!confirmacion) return;

    this.cargando = true;
    this.agendaService.eliminarSlot(turno.id).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = 'Slot libre eliminado de la agenda.';
        this.cargarAgenda(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'No se pudo eliminar el slot.';
        this.cdr.detectChanges();
      }
    });
  }

  marcarAsistido(turno: TurnoAgenda): void {
    this.cargando = true;
    this.agendaService.cambiarEstado(turno.id, 'ASISTIDO').subscribe({
      next: () => {
        this.cargando = false;
        turno.estado = 'ASISTIDO';
        this.mensajeExito = `Turno #${turno.id} marcado como ASISTIDO exitosamente.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'No se pudo actualizar el estado del turno.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelarTurno(turno: TurnoAgenda): void {
    const confirmacion = window.confirm(
      `¿Está seguro de que desea cancelar este turno reservado?`
    );
    if (!confirmacion) return;

    this.cargando = true;
    this.agendaService.cambiarEstado(turno.id, 'CANCELADO').subscribe({
      next: () => {
        this.cargando = false;
        turno.estado = 'CANCELADO';
        this.mensajeExito = `Turno #${turno.id} cancelado correctamente.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'No se pudo cancelar el turno.';
        this.cdr.detectChanges();
      }
    });
  }

  // Filtrado reactivo en UI
  get turnosFiltrados(): TurnoAgenda[] {
    if (!this.filtroEstado || this.filtroEstado === 'TODOS') {
      return this.turnos;
    }
    return this.turnos.filter(t => t.estado === this.filtroEstado);
  }

  get totalDisponibles(): number {
    return this.turnos.filter(t => t.estado === 'DISPONIBLE').length;
  }

  get totalReservados(): number {
    return this.turnos.filter(t => t.estado === 'RESERVADO').length;
  }

  get totalAsistidos(): number {
    return this.turnos.filter(t => t.estado === 'ASISTIDO').length;
  }

  get totalCancelados(): number {
    return this.turnos.filter(t => t.estado === 'CANCELADO').length;
  }

  establecerFechaHoy(): void {
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];
    this.cargarAgenda();
  }

  limpiarFecha(): void {
    this.fechaSeleccionada = '';
    this.cargarAgenda();
  }

  // =========================================================================
  // ATENCIÓN MÉDICA Y EVOLUCIÓN CLÍNICA (Issue F-11)
  // =========================================================================
  abrirModalAtencion(turno: TurnoAgenda): void {
    this.turnoAtencion = turno;
    this.atencionMotivo = turno.motivoConsulta || '';
    this.atencionDiagnostico = '';
    this.atencionTratamiento = '';
    this.atencionRecetas = '';
    this.atencionEstudios = '';
    this.atencionError = '';
    this.atencionGuardando = false;
    this.modalAtencionAbierto = true;
  }

  cerrarModalAtencion(): void {
    this.modalAtencionAbierto = false;
    this.turnoAtencion = null;
    this.atencionError = '';
  }

  guardarAtencion(): void {
    if (!this.turnoAtencion) return;

    if (!this.atencionMotivo?.trim()) {
      this.atencionError = 'El motivo de consulta es obligatorio.';
      return;
    }
    if (!this.atencionDiagnostico?.trim()) {
      this.atencionError = 'El diagnóstico clínico es obligatorio.';
      return;
    }
    if (!this.atencionTratamiento?.trim()) {
      this.atencionError = 'Las indicaciones o tratamiento médico son obligatorios.';
      return;
    }

    const payload: RegistrarAtencionRequest = {
      motivoConsulta: this.atencionMotivo.trim(),
      diagnostico: this.atencionDiagnostico.trim(),
      tratamiento: this.atencionTratamiento.trim(),
      recetasPrescritas: this.atencionRecetas?.trim() || undefined,
      estudiosSolicitados: this.atencionEstudios?.trim() || undefined
    };

    this.atencionGuardando = true;
    this.atencionError = '';

    this.historialClinicoService.registrarAtencion(this.turnoAtencion.id, payload).subscribe({
      next: (res: HistoriaClinicaResponse) => {
        this.atencionGuardando = false;
        if (this.turnoAtencion) {
          this.turnoAtencion.estado = 'ASISTIDO';
        }
        this.modalAtencionAbierto = false;
        this.mensajeExito = `¡Atención médica registrada exitosamente! Turno #${res.turnoId} marcado como ASISTIDO.`;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.atencionGuardando = false;
        this.atencionError = err.error?.message || 'Error al guardar la evolución médica en el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  abrirHistorialPrevio(pacienteId?: number, nombrePaciente?: string): void {
    if (!pacienteId) {
      this.mensajeError = 'El turno no posee un paciente asociado para consultar su historial.';
      return;
    }

    this.pacienteHistorialNombre = nombrePaciente || `Paciente #${pacienteId}`;
    this.modalHistorialPrevioAbierto = true;
    this.cargandoHistorialPrevio = true;
    this.errorHistorialPrevio = '';
    this.historialPrevio = [];

    this.historialClinicoService.obtenerHistorialPorPaciente(pacienteId).subscribe({
      next: (data: HistoriaClinicaResponse[]) => {
        this.cargandoHistorialPrevio = false;
        this.historialPrevio = data || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoHistorialPrevio = false;
        this.errorHistorialPrevio = err.error?.message || 'No se pudo cargar el historial del paciente.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarHistorialPrevio(): void {
    this.modalHistorialPrevioAbierto = false;
    this.historialPrevio = [];
    this.errorHistorialPrevio = '';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login-medico']);
  }
}
