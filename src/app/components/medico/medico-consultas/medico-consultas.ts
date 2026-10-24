import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HistorialClinicoService, HistoriaClinicaResponse, PacienteItem } from '../../../services/historial-clinico';
import { AuthService } from '../../../services/auth';
import { imprimirHistoriaClinicaDocumento } from '../../../utils/impresion-clinica';

@Component({
  selector: 'app-medico-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medico-consultas.html',
  styleUrls: ['./medico-consultas.css']
})
export class MedicoConsultasComponent implements OnInit {
  private historialService = inject(HistorialClinicoService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  pacientes: PacienteItem[] = [];
  cargandoPacientes: boolean = false;
  mensajeError: string = '';
  filtroBusqueda: string = '';

  // Modal de Historial Clínico de Paciente
  modalHistorialAbierto: boolean = false;
  pacienteSeleccionado: PacienteItem | null = null;
  historialClinico: HistoriaClinicaResponse[] = [];
  cargandoHistorial: boolean = false;
  errorHistorial: string = '';

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.cargandoPacientes = true;
    this.mensajeError = '';

    this.historialService.obtenerPacientes(this.filtroBusqueda).subscribe({
      next: (data) => {
        this.pacientes = data || [];
        this.cargandoPacientes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.pacientes = [];
        this.cargandoPacientes = false;
        this.mensajeError = err.error?.message || 'No se pudo cargar el listado de pacientes. Verifique la conexión.';
        console.error('Error al cargar pacientes', err);
        this.cdr.detectChanges();
      }
    });
  }

  buscar(): void {
    this.cargarPacientes();
  }

  limpiarBusqueda(): void {
    this.filtroBusqueda = '';
    this.cargarPacientes();
  }

  abrirHistorial(paciente: PacienteItem): void {
    this.pacienteSeleccionado = paciente;
    this.modalHistorialAbierto = true;
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    this.historialClinico = [];

    this.historialService.obtenerHistorialPorPaciente(paciente.id).subscribe({
      next: (data) => {
        this.historialClinico = data || [];
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.historialClinico = [];
        this.cargandoHistorial = false;
        this.errorHistorial = err.error?.message || 'No se pudo consultar el historial médico del paciente.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarHistorial(): void {
    this.modalHistorialAbierto = false;
    this.pacienteSeleccionado = null;
    this.historialClinico = [];
    this.errorHistorial = '';
  }

  imprimirHistorial(): void {
    if (!this.pacienteSeleccionado) return;
    imprimirHistoriaClinicaDocumento(
      {
        nombreCompleto: `${this.pacienteSeleccionado.apellido}, ${this.pacienteSeleccionado.nombre}`,
        dni: this.pacienteSeleccionado.dni,
        obraSocial: this.pacienteSeleccionado.obraSocialNombre,
        email: this.pacienteSeleccionado.email,
        telefono: this.pacienteSeleccionado.telefono
      },
      this.historialClinico
    );
  }
}
