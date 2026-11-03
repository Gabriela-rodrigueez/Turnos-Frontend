import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EspecialidadService, Especialidad, EspecialidadPayload } from '../../../services/especialidad';
import { AuthService } from '../../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './especialidades.html',
  styleUrls: ['./especialidades.css']
})
export class EspecialidadesComponent implements OnInit {
  private especialidadService = inject(EspecialidadService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Estados de datos y listado
  especialidades: Especialidad[] = [];
  filtroTexto: string = '';
  cargando: boolean = false;
  guardando: boolean = false;

  // Estados de alertas
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  mensajeErrorModal: string | null = null;

  // Estados de modal
  modalAbierto: boolean = false;
  modoEdicion: boolean = false;
  especialidadSeleccionadaId: number | null = null;

  // Formulario reactivo
  especialidadForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    descripcion: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    // Verificación de rol exclusivo de seguridad
    if (!this.authService.hasRole(['ADMIN', 'ADMINISTRADOR'])) {
      this.router.navigate(['/']);
      return;
    }

    this.cargarEspecialidades();
  }

  /**
   * Carga la lista completa de especialidades desde la API
   */
  cargarEspecialidades(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.especialidadService.getEspecialidades().subscribe({
      next: (data) => {
        this.especialidades = data || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar especialidades:', err);
        this.mensajeError = 'No se pudo cargar la cartilla de especialidades. Verificá la conexión con el servidor.';
        this.cargando = false;
      }
    });
  }

  /**
   * Filtro reactivo en memoria por nombre y descripción clínica
   */
  get especialidadesFiltradas(): Especialidad[] {
    if (!this.filtroTexto || !this.filtroTexto.trim()) {
      return this.especialidades;
    }
    const termino = this.filtroTexto.toLowerCase().trim();
    return this.especialidades.filter(e =>
      e.nombre.toLowerCase().includes(termino) ||
      (e.descripcion && e.descripcion.toLowerCase().includes(termino))
    );
  }

  /**
   * Retorna la longitud en tiempo real del campo 'descripcion'
   */
  get descripcionLength(): number {
    return this.especialidadForm.get('descripcion')?.value?.length || 0;
  }

  /**
   * Abre el modal en modo Alta
   */
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.especialidadSeleccionadaId = null;
    this.mensajeErrorModal = null;
    this.especialidadForm.reset({
      nombre: '',
      descripcion: ''
    });
    this.modalAbierto = true;
  }

  /**
   * Abre el modal en modo Edición poblando los datos existentes
   */
  abrirModalEditar(especialidad: Especialidad): void {
    this.modoEdicion = true;
    this.especialidadSeleccionadaId = especialidad.id;
    this.mensajeErrorModal = null;
    this.especialidadForm.reset({
      nombre: especialidad.nombre,
      descripcion: especialidad.descripcion || ''
    });
    this.modalAbierto = true;
  }

  /**
   * Cierra el modal y limpia el formulario
   */
  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbierto = false;
    this.mensajeErrorModal = null;
    this.especialidadForm.reset();
  }

  /**
   * Cierre accesible por teclado al presionar Escape
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.modalAbierto) {
      this.cerrarModal();
    }
  }

  /**
   * Envía el formulario para creación o actualización
   */
  guardarEspecialidad(): void {
    if (this.especialidadForm.invalid || this.guardando) {
      this.especialidadForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeErrorModal = null;

    const payload: EspecialidadPayload = {
      nombre: this.especialidadForm.value.nombre?.trim(),
      descripcion: this.especialidadForm.value.descripcion?.trim() || undefined
    };

    if (this.modoEdicion && this.especialidadSeleccionadaId != null) {
      this.especialidadService.actualizarEspecialidad(this.especialidadSeleccionadaId, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarMensajeExito('Especialidad médica actualizada exitosamente.');
          this.cargarEspecialidades();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando = false;
          this.manejarErrorModal(err);
        }
      });
    } else {
      this.especialidadService.crearEspecialidad(payload).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModal();
          this.mostrarMensajeExito('Especialidad médica dada de alta exitosamente.');
          this.cargarEspecialidades();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando = false;
          this.manejarErrorModal(err);
        }
      });
    }
  }

  /**
   * Maneja errores HTTP en el modal, capturando específicamente el código 409 Conflict
   */
  private manejarErrorModal(err: HttpErrorResponse): void {
    if (err.status === 409) {
      this.mensajeErrorModal = err.error?.message || err.error?.mensaje ||
        'Conflicto: Ya existe una especialidad médica registrada con ese nombre.';
    } else if (err.status === 400) {
      this.mensajeErrorModal = err.error?.message || err.error?.mensaje ||
        'Los datos ingresados no cumplen con el formato o longitud requerida.';
    } else if (err.status === 403) {
      this.mensajeErrorModal = 'Acceso denegado: Tu usuario no posee permisos para modificar especialidades.';
    } else {
      this.mensajeErrorModal = err.error?.message ||
        'Ocurrió un error inesperado al procesar la especialidad médica. Reintentá en unos momentos.';
    }
  }

  /**
   * Muestra alerta de éxito temporal
   */
  private mostrarMensajeExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    setTimeout(() => {
      if (this.mensajeExito === mensaje) {
        this.mensajeExito = null;
      }
    }, 4500);
  }

  limpiarFiltro(): void {
    this.filtroTexto = '';
  }
}
