import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin';
import { AuthService } from '../../../services/auth';
import { EspecialidadService, Especialidad } from '../../../services/especialidad';
import { ProfesionalService, Profesional } from '../../../services/profesional';
import { SedeService, Sede } from '../../../services/sede';
import { Paciente, TurnoHistorial, AdmisionItem, TotemTicket, NuevoPacientePresencialDTO, ReservaPresencialRequestDTO } from '../../../../models/admin.model';

@Component({
  selector: 'app-nueva-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-cita.html',
  styleUrls: ['./nueva-cita.css']
})
export class NuevaCitaComponent implements OnInit {
  public adminService = inject(AdminService);
  public authService = inject(AuthService);
  private especialidadService = inject(EspecialidadService);
  private profesionalService = inject(ProfesionalService);
  private sedeService = inject(SedeService);
  private cdr = inject(ChangeDetectorRef);

  // Sub-barra operativa
  ventanillaNombre: string = 'Ventanilla 3 - Mostrador / Trámite Presencial';
  operadorNombre: string = 'Lic. Mariana García';
  operadorLegajo: string = '#8841';
  estadoVentanilla: 'ATENDIENDO' | 'PAUSA' = 'ATENDIENDO';
  admisionesHoy: number = 32;
  tiempoPromedio: string = '3m 42s';

  // Paso 1: Búsqueda y Validación en Padrón
  dniBusqueda: string = '';
  buscando: boolean = false;
  busquedaRealizada: boolean = false;
  pacienteSeleccionado: Paciente | null = null;
  noEmpadronado: boolean = false;
  activeTab: 'ficha' | 'turnos' = 'ficha';
  turnosHistorial: TurnoHistorial[] = [];
  cargandoHistorial: boolean = false;

  // Paso 2: Cascada de Práctica Médica
  tipoPractica: string = 'CONSULTA';
  tiposPracticaDisponibles = [
    { id: 'CONSULTA', nombre: 'Consulta Especialidad', icono: 'stethoscope', badge: 'Habitual', desc: 'Atención ambulatoria médica' },
    { id: 'IMAGENES', nombre: 'Diagnóstico / Imágenes', icono: 'radiology', badge: 'Rx / Eco', desc: 'Estudios de imágenes y radiología' },
    { id: 'LABORATORIO', nombre: 'Laboratorio Bioquímico', icono: 'biotechnology', badge: 'Extracciones', desc: 'Análisis clínicos y perfil' },
    { id: 'SOBRETURNO', nombre: 'Sobreturno Protegido', icono: 'notification_important', badge: 'Prioridad', desc: 'Derivación urgente con orden' }
  ];

  especialidades: Especialidad[] = [];
  profesionales: Profesional[] = [];
  profesionalesFiltrados: Profesional[] = [];
  especialidadId: number | null = 1; // Cardiología por defecto
  profesionalId: number | null = 1; // Dr. Roberto Rossi / Pérez
  consultorioAsignado: string = 'Consultorio 12 - Pabellón Central';
  sedeSeleccionada: string = 'Hospital Central de Mendoza';
  sedeId: number = 1;

  // Paso 3: Grilla de Slots y Emisión
  fechasDisponibles: Array<{ label: string; valor: string; sublabel: string }> = [];
  fechaSeleccionada: string = '';
  slotsHorarios: Array<{ hora: string; disponible: boolean; cupo: string }> = [];
  slotSeleccionado: string | null = '09:30';

  ordenDerivacion: string = '';
  formatoEmision: 'TERMICA' | 'WHATSAPP' | 'AMBOS' = 'AMBOS';

  guardandoTurno: boolean = false;
  mensajeAlerta: string = '';
  mensajeExitoTurno: string = '';

  // Modal Alta Rápida de Paciente
  modalAltaAbierto: boolean = false;
  nuevoPaciente: NuevoPacientePresencialDTO = {
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    sexo: 'Femenino',
    telefono: '',
    email: '',
    obraSocialId: 1,
    obraSocialNombre: 'OSEP Mendoza',
    numeroAfiliado: ''
  };
  errorAltaModal: string = '';
  guardandoAlta: boolean = false;
  obrasSocialesLista = [
    { id: 1, nombre: 'OSEP Mendoza' },
    { id: 2, nombre: 'PAMI' },
    { id: 3, nombre: 'Swiss Medical' },
    { id: 4, nombre: 'Particular / Sin Cobertura' }
  ];

  // Columna Derecha: Tótem y Fila Actual
  totemTicket: TotemTicket = {
    numero: 'A-108',
    categoria: 'Atención General y Turnos',
    horaEmision: '10:42',
    tiempoEsperaMin: 3,
    enEspera: 4
  };
  ticketAnimado: boolean = false;
  ultimasAdmisiones: AdmisionItem[] = [];

  // Guardia del Día
  guardiaMedica = [
    { servicio: 'Cardiología Guardia', medico: 'Dr. Roberto Rossi', estado: 'En Consultorio 12' },
    { servicio: 'Clínica Médica', medico: 'Dra. Silvina Morales', estado: 'Box 4 PB' },
    { servicio: 'Traumatología', medico: 'Dr. Carlos Rodríguez', estado: 'Shockroom Trauma' }
  ];

  // Modal de Comprobante Térmico
  modalTicketAbierto: boolean = false;
  ticketActivo: AdmisionItem | null = null;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.nombreCompleto) {
      this.operadorNombre = user.nombreCompleto;
      if (user.legajo) {
        this.operadorLegajo = `#${user.legajo}`;
      }
    }
    this.cargarCatalogos();
    this.generarFechasDisponibles();
    this.generarSlotsHorarios();
    this.totemTicket = this.adminService.getTotemTicket();
    this.ultimasAdmisiones = this.adminService.getUltimasAdmisiones();
  }

  cargarCatalogos(): void {
    this.especialidadService.getEspecialidades().subscribe(esps => {
      this.especialidades = esps && esps.length > 0 ? esps : [
        { id: 1, nombre: 'Cardiología' },
        { id: 2, nombre: 'Pediatría' },
        { id: 3, nombre: 'Traumatología' },
        { id: 4, nombre: 'Clínica Médica' }
      ];
      this.cdr.detectChanges();
    });

    this.profesionalService.getProfesionales().subscribe(profs => {
      this.profesionales = profs && profs.length > 0 ? profs : [
        { id: 1, nombre: 'Roberto', apellido: 'Rossi', especialidades: [{ id: 1, nombre: 'Cardiología' }] },
        { id: 2, nombre: 'María', apellido: 'Gómez', especialidades: [{ id: 2, nombre: 'Pediatría' }] },
        { id: 3, nombre: 'Carlos', apellido: 'Rodríguez', especialidades: [{ id: 3, nombre: 'Traumatología' }, { id: 4, nombre: 'Clínica Médica' }] }
      ];
      this.filtrarProfesionales();
      this.cdr.detectChanges();
    });
  }

  // Paso 1: Validar en Padrón (GET /api/v1/admin/pacientes/buscar?query={dni})
  validarEnPadron(dniDirecto?: string): void {
    const valor = dniDirecto !== undefined ? dniDirecto : this.dniBusqueda;
    if (!valor || !valor.trim()) {
      return;
    }

    this.dniBusqueda = valor.trim();
    this.buscando = true;
    this.busquedaRealizada = true;
    this.noEmpadronado = false;
    this.pacienteSeleccionado = null;
    this.mensajeAlerta = '';
    this.mensajeExitoTurno = '';
    this.cdr.detectChanges();

    this.adminService.buscarPaciente(this.dniBusqueda).subscribe({
      next: (paciente) => {
        this.buscando = false;
        if (paciente) {
          this.seleccionarPaciente(paciente);
        } else {
          this.noEmpadronado = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscando = false;
        this.noEmpadronado = true;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.noEmpadronado = false;
    this.activeTab = 'ficha';
    this.cargarHistorialPaciente(paciente.id);
    this.cdr.detectChanges();
  }

  cambiarPaciente(): void {
    this.pacienteSeleccionado = null;
    this.noEmpadronado = false;
    this.busquedaRealizada = false;
    this.dniBusqueda = '';
    this.turnosHistorial = [];
  }

  cargarHistorialPaciente(pacienteId: number): void {
    this.cargandoHistorial = true;
    this.adminService.obtenerTurnosPaciente(pacienteId).subscribe(turnos => {
      this.turnosHistorial = turnos || [];
      this.cargandoHistorial = false;
      this.cdr.detectChanges();
    });
  }

  // Paso 2: Cascada
  seleccionarTipoPractica(tipo: any): void {
    this.tipoPractica = tipo;
    if (tipo === 'LABORATORIO') {
      this.consultorioAsignado = 'Box 3 - Extracciones Central';
    } else if (tipo === 'IMAGENES') {
      this.consultorioAsignado = 'Sala Rx 2 - Subsuelo';
    } else if (tipo === 'SOBRETURNO') {
      this.consultorioAsignado = 'Consultorio 12 - Guardia Prioritaria';
    } else {
      this.consultorioAsignado = 'Consultorio 12 - Pabellón Central';
    }
    this.generarSlotsHorarios();
  }

  onEspecialidadChange(): void {
    this.filtrarProfesionales();
    this.generarSlotsHorarios();
  }

  filtrarProfesionales(): void {
    if (!this.especialidadId) {
      this.profesionalesFiltrados = [...this.profesionales];
    } else {
      this.profesionalesFiltrados = this.profesionales.filter(p => {
        if (!p.especialidades || p.especialidades.length === 0) return true;
        return p.especialidades.some(e => e.id === Number(this.especialidadId));
      });
    }

    if (this.profesionalesFiltrados.length > 0) {
      this.profesionalId = this.profesionalesFiltrados[0].id;
    } else {
      this.profesionalId = null;
    }
  }

  // Paso 3: Grilla de Horarios
  generarFechasDisponibles(): void {
    const opciones: Array<{ label: string; valor: string; sublabel: string }> = [];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const hoy = new Date();
    let agregados = 0;
    let offset = 1;
    while (agregados < 5) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + offset);
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const valorIso = `${yyyy}-${mm}-${dd}`;

        const nombreDia = agregados === 0 ? 'Mañana' : dias[diaSemana];
        const sub = `${dd} de ${meses[fecha.getMonth()]}`;

        opciones.push({ label: nombreDia, valor: valorIso, sublabel: sub });
        agregados++;
      }
      offset++;
    }

    this.fechasDisponibles = opciones;
    if (opciones.length > 0) {
      this.fechaSeleccionada = opciones[0].valor;
    }
  }

  generarSlotsHorarios(): void {
    if (this.tipoPractica === 'SOBRETURNO') {
      this.slotsHorarios = [
        { hora: '08:45', disponible: true, cupo: 'Sobreturno 1/2' },
        { hora: '10:00', disponible: true, cupo: 'Sobreturno 2/2' },
        { hora: '12:30', disponible: true, cupo: 'Sobreturno Cierre' }
      ];
    } else {
      this.slotsHorarios = [
        { hora: '08:30', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '09:15', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '09:30', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '10:15', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '11:00', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '11:30', disponible: true, cupo: 'Cupo 1/1' },
        { hora: '12:15', disponible: true, cupo: 'Cupo 1/1' }
      ];
    }
    if (this.slotsHorarios.length > 0) {
      this.slotSeleccionado = this.slotsHorarios[2].hora; // 09:30
    }
  }

  confirmarAsignacion(): void {
    if (!this.pacienteSeleccionado || !this.especialidadId || !this.profesionalId || !this.slotSeleccionado) {
      alert('Por favor complete todos los campos requeridos para la emisión.');
      return;
    }

    this.guardandoTurno = true;
    this.mensajeAlerta = '';
    this.mensajeExitoTurno = '';

    const fechaHoraIso = `${this.fechaSeleccionada}T${this.slotSeleccionado}:00`;
    const esp = this.especialidades.find(e => e.id === Number(this.especialidadId));
    const prof = this.profesionales.find(p => p.id === Number(this.profesionalId));

    const request: ReservaPresencialRequestDTO = {
      pacienteId: this.pacienteSeleccionado.id,
      profesionalId: Number(this.profesionalId),
      especialidadId: Number(this.especialidadId),
      sedeId: this.sedeId,
      fechaHora: fechaHoraIso,
      motivoConsulta: `Atención Presencial Mostrador - ${this.tipoPractica}`,
      observaciones: this.ordenDerivacion ? `Orden: ${this.ordenDerivacion}` : 'Trámite Presencial'
    };

    const extra = {
      paciente: this.pacienteSeleccionado,
      especialidadNombre: esp ? esp.nombre : 'Cardiología',
      profesionalNombre: prof ? `Dr/a. ${prof.nombre} ${prof.apellido}` : 'Dr. Roberto Rossi',
      sedeNombre: this.sedeSeleccionada,
      tipoPractica: this.tiposPracticaDisponibles.find(t => t.id === this.tipoPractica)?.nombre || 'Consulta Especialidad',
      formatoEmision: this.formatoEmision === 'TERMICA' ? 'Térmica (Ventanilla)' : (this.formatoEmision === 'WHATSAPP' ? 'WhatsApp' : 'Térmica + WhatsApp'),
      ordenDerivacion: this.ordenDerivacion
    };

    this.adminService.reservarTurnoPresencial(request, extra).subscribe({
      next: () => {
        this.guardandoTurno = false;
        this.admisionesHoy++;
        this.ultimasAdmisiones = this.adminService.getUltimasAdmisiones();
        this.ticketActivo = this.ultimasAdmisiones[0];
        this.modalTicketAbierto = true;
        this.mensajeExitoTurno = `¡Turno confirmado para ${this.pacienteSeleccionado?.nombre} ${this.pacienteSeleccionado?.apellido}!`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoTurno = false;
        this.mensajeAlerta = 'No se pudo completar la emisión del turno.';
        this.cdr.detectChanges();
      }
    });
  }

  // Modal Alta Rápida
  abrirModalAlta(dniInicial?: string): void {
    this.errorAltaModal = '';
    this.nuevoPaciente = {
      dni: dniInicial || this.dniBusqueda.replace(/\D/g, '') || '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '1992-06-18',
      sexo: 'Masculino',
      telefono: '261-',
      email: '',
      obraSocialId: 1,
      obraSocialNombre: 'OSEP Mendoza',
      numeroAfiliado: ''
    };
    this.modalAltaAbierto = true;
  }

  cerrarModalAlta(): void {
    this.modalAltaAbierto = false;
  }

  guardarNuevoPaciente(): void {
    if (!this.nuevoPaciente.dni || !this.nuevoPaciente.nombre.trim() || !this.nuevoPaciente.apellido.trim()) {
      this.errorAltaModal = 'DNI, Nombre y Apellido son obligatorios.';
      return;
    }

    this.guardandoAlta = true;
    this.adminService.registrarPacientePresencial(this.nuevoPaciente).subscribe({
      next: (creado) => {
        this.guardandoAlta = false;
        this.cerrarModalAlta();
        this.seleccionarPaciente(creado);
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoAlta = false;
        this.errorAltaModal = 'Error al registrar el paciente.';
        this.cdr.detectChanges();
      }
    });
  }

  // Tótem y Llamador
  llamarSiguienteTicket(): void {
    this.ticketAnimado = true;
    this.totemTicket = this.adminService.llamarSiguienteTicket();
    setTimeout(() => {
      this.ticketAnimado = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  reimprimir(admision: AdmisionItem): void {
    this.ticketActivo = admision;
    this.modalTicketAbierto = true;
  }

  cerrarModalTicket(): void {
    this.modalTicketAbierto = false;
    this.ticketActivo = null;
  }

  imprimirTicket(): void {
    window.print();
  }

  pausarVentanilla(): void {
    this.estadoVentanilla = this.estadoVentanilla === 'ATENDIENDO' ? 'PAUSA' : 'ATENDIENDO';
  }
}
