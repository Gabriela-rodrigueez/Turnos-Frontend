import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FamiliarService, Familiar, FamiliarRequest } from '../../services/familiar';

// Validador personalizado para asegurar que la fecha de nacimiento esté en el pasado
export function fechaPasadaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fechaIngresada = new Date(control.value);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fechaIngresada >= hoy) {
    return { fechaFutura: true };
  }
  return null;
}

@Component({
  selector: 'app-grupo-familiar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './grupo-familiar.html',
  styleUrls: ['./grupo-familiar.css']
})
export class GrupoFamiliarComponent implements OnInit {
  public authService = inject(AuthService);
  private familiarService = inject(FamiliarService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  public router = inject(Router);

  familiares: Familiar[] = [];
  cargando = false;
  guardando = false;
  eliminando = false;

  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  // Control de Modales
  mostrarModalAgregar = false;
  familiarABajar: Familiar | null = null;

  // Formulario reactivo para alta de dependiente
  formFamiliar!: FormGroup;

  // Catálogo de parentescos sugeridos
  parentescos = [
    { valor: 'Hijo/a', label: 'Hijo/a' },
    { valor: 'Cónyuge', label: 'Cónyuge' },
    { valor: 'Adulto Mayor', label: 'Adulto Mayor a cargo' },
    { valor: 'Otro', label: 'Otro (Bajo tutela legal)' }
  ];

  // Catálogo de obras sociales
  obrasSociales = [
    { id: 1, nombre: 'OSEP Mendoza' },
    { id: 2, nombre: 'PAMI' },
    { id: 3, nombre: 'Swiss Medical' },
    { id: 4, nombre: 'OSDE' },
    { id: 5, nombre: 'Particular / Sin Obra Social' }
  ];

  // Fecha máxima permitida (ayer o hoy)
  fechaMaxima = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-paciente']);
      return;
    }

    this.initForm();
    this.cargarFamiliares();
  }

  private initForm(): void {
    this.formFamiliar = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]],
      fechaNacimiento: ['', [Validators.required, fechaPasadaValidator]],
      parentesco: ['Hijo/a', [Validators.required]],
      obraSocialId: [1],
      telefono: ['']
    });
  }

  get f() {
    return this.formFamiliar.controls;
  }

  get tutorId(): number {
    return this.authService.getPacienteId() || 1;
  }

  cargarFamiliares(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.familiarService.listarFamiliares(this.tutorId).subscribe({
      next: (data) => {
        // Filtramos sólo los activos por seguridad
        this.familiares = (data || []).filter(f => f.isActive !== false && f.isActivo !== false);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al listar familiares:', err);
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar el listado de familiares. Verifique la conexión con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalAgregar(): void {
    this.formFamiliar.reset({
      parentesco: 'Hijo/a',
      obraSocialId: 1
    });
    this.mensajeExito = null;
    this.mensajeError = null;
    this.mostrarModalAgregar = true;
  }

  cerrarModalAgregar(): void {
    if (!this.guardando) {
      this.mostrarModalAgregar = false;
    }
  }

  guardarFamiliar(): void {
    if (this.formFamiliar.invalid) {
      this.formFamiliar.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const formValues = this.formFamiliar.value;
    const request: FamiliarRequest = {
      nombre: formValues.nombre.trim(),
      apellido: formValues.apellido.trim(),
      dni: formValues.dni.trim(),
      fechaNacimiento: formValues.fechaNacimiento,
      parentesco: formValues.parentesco,
      telefono: formValues.telefono ? formValues.telefono.trim() : undefined,
      obraSocialId: formValues.obraSocialId ? Number(formValues.obraSocialId) : undefined
    };

    this.familiarService.registrarFamiliar(this.tutorId, request).subscribe({
      next: (nuevoFamiliar) => {
        this.guardando = false;
        this.mostrarModalAgregar = false;
        
        // Asignar nombre de obra social para presentación limpia inmediata
        const osEncontrada = this.obrasSociales.find(os => os.id === request.obraSocialId);
        const familiarNormalizado: Familiar = {
          ...nuevoFamiliar,
          obraSocialNombre: nuevoFamiliar.obraSocialNombre || osEncontrada?.nombre || 'OSEP Mendoza',
          isActive: true
        };

        this.familiares = [...this.familiares, familiarNormalizado];
        this.mensajeExito = `¡Familiar ${familiarNormalizado.nombre} ${familiarNormalizado.apellido} registrado exitosamente!`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al registrar familiar:', err);
        this.guardando = false;
        if (err.status === 400 && err.error?.message) {
          this.mensajeError = err.error.message;
        } else if (err.status === 409) {
          this.mensajeError = 'Ya existe un paciente o familiar registrado con el DNI ingresado.';
        } else {
          this.mensajeError = 'Ocurrió un error al intentar registrar el familiar. Verifique los datos ingresados.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // --- Modal Confirmación Baja Lógica ---

  iniciarBaja(familiar: Familiar): void {
    this.familiarABajar = familiar;
    this.mensajeExito = null;
    this.mensajeError = null;
  }

  cancelarBaja(): void {
    if (!this.eliminando) {
      this.familiarABajar = null;
    }
  }

  confirmarBaja(): void {
    if (!this.familiarABajar) return;

    const familiar = this.familiarABajar;
    this.eliminando = true;
    this.mensajeError = null;

    this.familiarService.darDeBajaFamiliar(this.tutorId, familiar.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.familiarABajar = null;
        // Soft delete: desaparece de la lista activa en tiempo real
        this.familiares = this.familiares.filter(f => f.id !== familiar.id);
        this.mensajeExito = `Se dio de baja a ${familiar.nombre} ${familiar.apellido}. Su historial médico y turnos previos permanecen protegidos.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al dar de baja familiar:', err);
        this.eliminando = false;
        this.mensajeError = 'No se pudo procesar la baja del familiar. Intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  calcularEdad(fechaNacimiento: string): number {
    return this.familiarService.calcularEdad(fechaNacimiento);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '--/--/----';
    const partes = fecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mostrarModalAgregar && !this.guardando) {
      this.cerrarModalAgregar();
    }
    if (this.familiarABajar && !this.eliminando) {
      this.cancelarBaja();
    }
  }
}
