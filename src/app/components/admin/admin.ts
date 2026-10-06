import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { EspecialidadService, Especialidad } from '../../services/especialidad';
import { ProfesionalService, Profesional } from '../../services/profesional';
import { SedeService, Sede } from '../../services/sede';
import { Paciente, TurnoHistorial, AdmisionItem, TotemTicket, NuevoPacientePresencialDTO, ReservaPresencialRequestDTO } from '../../../models/admin.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  public adminService = inject(AdminService);
  public authService = inject(AuthService);
  private especialidadService = inject(EspecialidadService);
  private profesionalService = inject(ProfesionalService);
  private sedeService = inject(SedeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // --- Header y Contexto Hospitalario ---
  sedesList: string[] = [
    'Hospital Central de Mendoza',
    'Hospital Luis Lagomaggiore',
    'Hospital Pediátrico Humberto Notti',
    'Hospital Diego Paroissien',
    'CAPS N° 16 Godoy Cruz'
  ];
  sedeSeleccionada: string = 'Hospital Central de Mendoza';
  sedeId: number = 1;

  horaActual: string = '';
  private timerReloj: any;

  // --- Subheader Operativo ---
  ventanillaNombre: string = 'Ventanilla 3 - Mostrador / Trámite Presencial';
  operadorNombre: string = 'Lic. Mariana García';
  operadorLegajo: string = '#8841';
  estadoVentanilla: 'ATENDIENDO' | 'PAUSA' = 'ATENDIENDO';
  admisionesHoy: number = 32;
  tiempoPromedio: string = '3m 42s';

  // --- Paso 1: Búsqueda y Ficha de Paciente ---
  searchQuery: string = '';
  buscando: boolean = false;
  busquedaRealizada: boolean = false;
  pacienteSeleccionado: Paciente | null = null;
  noEmpadronado: boolean = false;
  activeTab: 'ficha' | 'turnos' = 'ficha';
  turnosHistorial: TurnoHistorial[] = [];
  cargandoHistorial: boolean = false;

  // --- Paso 2: Selección de Práctica y Especialidad ---
  tipoPractica: 'CONSULTA' | 'IMAGENES' | 'LABORATORIO' | 'SOBRETURNO' = 'CONSULTA';
  tiposPracticaDisponibles = [
    { id: 'CONSULTA', nombre: 'Consulta Especialidad', icono: 'stethoscope', badge: 'Habitual', desc: 'Atención ambulatoria médica' },
    { id: 'IMAGENES', nombre: 'Diagnóstico / Imágenes', icono: 'radiology', badge: 'Rx / Eco', desc: 'Estudios de imágenes y radiología' },
    { id: 'LABORATORIO', nombre: 'Laboratorio Bioquímico', icono: 'biotechnology', badge: 'Extracciones', desc: 'Análisis clínicos y perfil' },
    { id: 'SOBRETURNO', nombre: 'Sobreturno Protegido', icono: 'notification_important', badge: 'Prioridad', desc: 'Derivación urgente con orden' }
  ];

  especialidades: Especialidad[] = [];
  profesionales: Profesional[] = [];
  profesionalesFiltrados: Profesional[] = [];
  especialidadId: number | null = null;
  profesionalId: number | null = null;
  consultorioAsignado: string = 'Consultorio 12 - Pabellón A';

  // --- Paso 3: Slots de Horarios y Emisión ---
  fechasDisponibles: Array<{ label: string; valor: string; sublabel: string }> = [];
  fechaSeleccionada: string = '';
  slotsHorarios: Array<{ hora: string; disponible: boolean; cupo: string }> = [];
  slotSeleccionado: string | null = null;

  ordenDerivacion: string = '';
  formatoEmision: 'TERMICA' | 'WHATSAPP' | 'AMBOS' = 'AMBOS';

  guardandoTurno: boolean = false;
  mensajeAlerta: string = '';
  mensajeExitoTurno: string = '';

  // --- Modal de Alta Rápida de Paciente ---
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

  // --- Panel Lateral Derecho ---
  totemTicket: TotemTicket = {
    numero: 'A-142',
    categoria: 'Atención General / Mostrador',
    horaEmision: '10:42',
    tiempoEsperaMin: 4,
    enEspera: 5
  };
  ticketAnimado: boolean = false;
  ultimasAdmisiones: AdmisionItem[] = [];

  // --- Modal de Comprobante Térmico ---
  modalTicketAbierto: boolean = false;
  ticketActivo: AdmisionItem | null = null;

  ngOnInit(): void {
    this.iniciarReloj();
    this.cargarCatalogos();
    this.generarFechasDisponibles();
    this.generarSlotsHorarios();
    this.totemTicket = this.adminService.getTotemTicket();
    this.ultimasAdmisiones = this.adminService.getUltimasAdmisiones();

    // Actualizar nombre del operador desde sesión si existe
    const sesion = this.authService.currentUser();
    if (sesion?.nombreCompleto) {
      this.operadorNombre = sesion.nombreCompleto;
      if (sesion.legajo) {
        this.operadorLegajo = `#${sesion.legajo}`;
      }
    }
  }

  private iniciarReloj(): void {
    const updateTime = () => {
      const now = new Date();
      this.horaActual = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateTime();
    this.timerReloj = setInterval(updateTime, 1000);
  }

  // --- Carga de catálogos ---
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
        { id: 1, nombre: 'Roberto', apellido: 'Pérez', especialidades: [{ id: 1, nombre: 'Cardiología' }] },
        { id: 2, nombre: 'María', apellido: 'Gómez', especialidades: [{ id: 2, nombre: 'Pediatría' }] },
        { id: 3, nombre: 'Carlos', apellido: 'Rodríguez', especialidades: [{ id: 3, nombre: 'Traumatología' }, { id: 4, nombre: 'Clínica Médica' }] }
      ];
      this.filtrarProfesionales();
      this.cdr.detectChanges();
    });
  }

  onSedeChange(nuevaSede: string): void {
    this.sedeSeleccionada = nuevaSede;
    if (nuevaSede.includes('Central')) this.sedeId = 1;
    else if (nuevaSede.includes('Notti')) this.sedeId = 2;
    else if (nuevaSede.includes('Lagomaggiore')) this.sedeId = 3;
    else this.sedeId = 4;
  }

  // --- Paso 1: Flujo de Búsqueda y Ficha ---
  ejecutarBusqueda(queryDirecto?: string): void {
    const valor = queryDirecto !== undefined ? queryDirecto : this.searchQuery;
    if (!valor || !valor.trim()) {
      return;
    }

    this.searchQuery = valor.trim();
    this.buscando = true;
    this.busquedaRealizada = true;
    this.noEmpadronado = false;
    this.pacienteSeleccionado = null;
    this.mensajeAlerta = '';
    this.mensajeExitoTurno = '';
    this.cdr.detectChanges();

    this.adminService.buscarPaciente(this.searchQuery).subscribe({
      next: (paciente) => {
        this.buscando = false;
        if (paciente) {
          this.seleccionarPaciente(paciente);
        } else {
          this.noEmpadronado = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error buscando paciente:', err);
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

    // Auto-completar orden o cobertura si es necesario
    if (!this.especialidadId && this.especialidades.length > 0) {
      this.especialidadId = this.especialidades[0].id;
      this.onEspecialidadChange();
    }
    this.cdr.detectChanges();
  }

  cambiarPaciente(): void {
    this.pacienteSeleccionado = null;
    this.noEmpadronado = false;
    this.busquedaRealizada = false;
    this.searchQuery = '';
    this.turnosHistorial = [];
    this.slotSeleccionado = null;
    this.mensajeExitoTurno = '';
  }

  cambiarTab(tab: 'ficha' | 'turnos'): void {
    this.activeTab = tab;
  }

  cargarHistorialPaciente(pacienteId: number): void {
    this.cargandoHistorial = true;
    this.adminService.obtenerTurnosPaciente(pacienteId).subscribe(turnos => {
      this.turnosHistorial = turnos || [];
      this.cargandoHistorial = false;
      this.cdr.detectChanges();
    });
  }

  // --- Modal de Alta Rápida ---
  abrirModalAlta(dniInicial?: string): void {
    this.errorAltaModal = '';
    this.nuevoPaciente = {
      dni: dniInicial || this.searchQuery.replace(/\D/g, '') || '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '1995-04-12',
      sexo: 'Femenino',
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
    this.errorAltaModal = '';
  }

  onObraSocialChange(id: number): void {
    this.nuevoPaciente.obraSocialId = Number(id);
    const os = this.obrasSocialesLista.find(o => o.id === Number(id));
    this.nuevoPaciente.obraSocialNombre = os ? os.nombre : 'Particular';
  }

  guardarNuevoPaciente(): void {
    this.errorAltaModal = '';

    if (!this.nuevoPaciente.dni || this.nuevoPaciente.dni.length < 7) {
      this.errorAltaModal = 'Ingrese un DNI válido (mínimo 7 dígitos).';
      return;
    }
    if (!this.nuevoPaciente.nombre.trim() || !this.nuevoPaciente.apellido.trim()) {
      this.errorAltaModal = 'El nombre y apellido son obligatorios.';
      return;
    }
    if (!this.nuevoPaciente.fechaNacimiento) {
      this.errorAltaModal = 'Ingrese una fecha de nacimiento válida.';
      return;
    }
    if (!this.nuevoPaciente.telefono || this.nuevoPaciente.telefono.trim().length < 6) {
      this.errorAltaModal = 'Ingrese un número telefónico de contacto.';
      return;
    }

    this.guardandoAlta = true;
    this.adminService.registrarPacientePresencial(this.nuevoPaciente).subscribe({
      next: (pacienteCreado) => {
        this.guardandoAlta = false;
        this.cerrarModalAlta();
        // Seleccionar automáticamente al paciente recién creado y colocarlo en la ficha del Paso 1
        this.seleccionarPaciente(pacienteCreado);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoAlta = false;
        this.errorAltaModal = 'No se pudo completar el registro presencial. Intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  // --- Paso 2: Cascada Especialidad -> Profesional -> Consultorio ---
  seleccionarTipoPractica(tipo: any): void {
    this.tipoPractica = tipo;
    this.slotSeleccionado = null;

    if (tipo === 'LABORATORIO') {
      this.consultorioAsignado = 'Box 3 - Extracciones Central';
    } else if (tipo === 'IMAGENES') {
      this.consultorioAsignado = 'Sala Rx 2 - Subsuelo';
    } else if (tipo === 'SOBRETURNO') {
      this.consultorioAsignado = 'Consultorio 12 - Guardia Prioritaria';
    } else {
      this.consultorioAsignado = 'Consultorio 12 - Pabellón A';
    }
    this.generarSlotsHorarios();
  }

  onEspecialidadChange(): void {
    this.filtrarProfesionales();
    this.slotSeleccionado = null;
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

  onProfesionalChange(): void {
    this.slotSeleccionado = null;
    this.generarSlotsHorarios();
  }

  // --- Paso 3: Grilla de Horarios y Emisión ---
  generarFechasDisponibles(): void {
    const opciones: Array<{ label: string; valor: string; sublabel: string }> = [];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const hoy = new Date();
    // Generar próximos 5 días hábiles
    let agregados = 0;
    let offset = 1; // Mañana en adelante para que sean válidos en backend
    while (agregados < 5) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + offset);
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Lunes a Viernes
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        const valorIso = `${yyyy}-${mm}-${dd}`;

        const nombreDia = agregados === 0 ? 'Mañana' : dias[diaSemana];
        const sub = `${dd} de ${meses[fecha.getMonth()]}`;

        opciones.push({
          label: nombreDia,
          valor: valorIso,
          sublabel: sub
        });
        agregados++;
      }
      offset++;
    }

    this.fechasDisponibles = opciones;
    if (opciones.length > 0) {
      this.fechaSeleccionada = opciones[0].valor;
    }
  }

  seleccionarFecha(valorIso: string): void {
    this.fechaSeleccionada = valorIso;
    this.slotSeleccionado = null;
    this.generarSlotsHorarios();
  }

  generarSlotsHorarios(): void {
    // Generar slots típicos institucionales de 20/30 min
    const base = [
      { hora: '08:30', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '09:00', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '09:30', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '10:15', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '11:00', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '11:30', disponible: true, cupo: 'Cupo 1/1' },
      { hora: '12:15', disponible: true, cupo: 'Cupo 1/1' }
    ];

    if (this.tipoPractica === 'SOBRETURNO') {
      this.slotsHorarios = [
        { hora: '08:45', disponible: true, cupo: 'Sobreturno 1/2' },
        { hora: '10:00', disponible: true, cupo: 'Sobreturno 2/2' },
        { hora: '12:30', disponible: true, cupo: 'Sobreturno Cierre' }
      ];
    } else {
      this.slotsHorarios = base;
    }

    // Preseleccionar el primer slot disponible
    if (this.slotsHorarios.length > 0) {
      this.slotSeleccionado = this.slotsHorarios[0].hora;
    }
  }

  seleccionarSlot(hora: string): void {
    this.slotSeleccionado = hora;
  }

  // --- Confirmar Asignación y Emitir Turno ---
  confirmarAsignacion(): void {
    if (!this.pacienteSeleccionado) {
      alert('Debe tener un paciente seleccionado en el Paso 1.');
      return;
    }
    if (!this.especialidadId) {
      alert('Seleccione la especialidad médica requerida.');
      return;
    }
    if (!this.profesionalId) {
      alert('Seleccione el profesional asignado.');
      return;
    }
    if (!this.fechaSeleccionada || !this.slotSeleccionado) {
      alert('Seleccione la fecha y el horario del turno.');
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
      motivoConsulta: `Atención Presencial Ventanilla 3 - ${this.tipoPractica}`,
      observaciones: this.ordenDerivacion ? `Orden: ${this.ordenDerivacion}` : 'Trámite Presencial Mostrador'
    };

    const extra = {
      paciente: this.pacienteSeleccionado,
      especialidadNombre: esp ? esp.nombre : 'Especialidad',
      profesionalNombre: prof ? `Dr/a. ${prof.nombre} ${prof.apellido}` : 'Profesional Médico',
      sedeNombre: this.sedeSeleccionada,
      tipoPractica: this.tiposPracticaDisponibles.find(t => t.id === this.tipoPractica)?.nombre || 'Consulta',
      formatoEmision: this.formatoEmision === 'TERMICA' ? 'Térmica (Ventanilla)' : (this.formatoEmision === 'WHATSAPP' ? 'Notificación WhatsApp' : 'Ticket Térmico + WhatsApp'),
      ordenDerivacion: this.ordenDerivacion
    };

    this.adminService.reservarTurnoPresencial(request, extra).subscribe({
      next: (res) => {
        this.guardandoTurno = false;
        this.admisionesHoy++;
        this.ultimasAdmisiones = this.adminService.getUltimasAdmisiones();

        // Preparar comprobante para vista previa y emisión inmediata
        const admisionReciente = this.ultimasAdmisiones[0];
        this.ticketActivo = admisionReciente;
        this.modalTicketAbierto = true;

        this.mensajeExitoTurno = `¡Turno confirmado y emitido con éxito para ${this.pacienteSeleccionado?.nombre} ${this.pacienteSeleccionado?.apellido}!`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoTurno = false;
        this.mensajeAlerta = 'No se pudo completar la asignación del turno. Verifique los datos o intente otro horario.';
        console.error('Error al reservar turno presencial:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // --- Tótem y Monitor de Espera ---
  llamarSiguienteTicket(): void {
    this.ticketAnimado = true;
    this.totemTicket = this.adminService.llamarSiguienteTicket();

    // Reproducir tono sutil de llamado en ventanilla (Web Audio API)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // La5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio fallback silencioso si el navegador no permite autoplay
    }

    setTimeout(() => {
      this.ticketAnimado = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  // --- Reimpresión y Comprobante Térmico ---
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

  // --- Acciones de Ventanilla ---
  nuevaAdmision(): void {
    this.cambiarPaciente();
    this.ordenDerivacion = '';
    this.slotSeleccionado = null;
  }

  pausarVentanilla(): void {
    this.estadoVentanilla = this.estadoVentanilla === 'ATENDIENDO' ? 'PAUSA' : 'ATENDIENDO';
  }

  // --- Switcher rápido de roles para pruebas de acceso ---
  cambiarRolPrueba(rol: 'ADMIN' | 'MEDICO' | 'PACIENTE'): void {
    if (rol === 'ADMIN') {
      this.authService.loginAsAdmin();
    } else if (rol === 'MEDICO') {
      this.authService.loginAsMedico();
    } else {
      this.authService.loginAsPaciente(1);
      // Redirigir porque AdminGuard bloqueará a rol PACIENTE
      this.router.navigate(['/']);
    }
  }
}
