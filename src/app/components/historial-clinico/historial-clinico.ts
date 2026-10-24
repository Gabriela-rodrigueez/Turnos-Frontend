import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HistorialClinicoService, HistoriaClinicaResponse } from '../../services/historial-clinico';
import { AuthService } from '../../services/auth';
import { imprimirHistoriaClinicaDocumento } from '../../utils/impresion-clinica';

@Component({
  selector: 'app-historial-clinico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial-clinico.html'
})
export class HistorialClinicoComponent implements OnInit {
  private historialService = inject(HistorialClinicoService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  historial: HistoriaClinicaResponse[] = [];
  cargando: boolean = true;
  mensajeError: string = '';
  filtroTexto: string = '';

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.historialService.obtenerMiHistorial().subscribe({
      next: (data) => {
        this.historial = data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.historial = [];
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar tu historial clínico. Por favor, reintenta más tarde.';
        console.error('Error al cargar historial clínico', err);
        this.cdr.detectChanges();
      }
    });
  }

  get historialFiltrado(): HistoriaClinicaResponse[] {
    if (!this.filtroTexto.trim()) {
      return this.historial;
    }
    const q = this.filtroTexto.toLowerCase();
    return this.historial.filter(h =>
      (h.diagnostico && h.diagnostico.toLowerCase().includes(q)) ||
      (h.profesionalNombreCompleto && h.profesionalNombreCompleto.toLowerCase().includes(q)) ||
      (h.especialidadNombre && h.especialidadNombre.toLowerCase().includes(q)) ||
      (h.motivoConsulta && h.motivoConsulta.toLowerCase().includes(q)) ||
      (h.sedeNombre && h.sedeNombre.toLowerCase().includes(q))
    );
  }

  imprimirResumen(): void {
    const user = this.authService.currentUser();
    const dniPaciente = user?.dni || (this.historial.length > 0 ? this.historial[0].pacienteDni : 'No informado');
    const obraSocialPaciente = this.historial.length > 0 ? (this.historial[0] as any).obraSocialNombre : undefined;

    imprimirHistoriaClinicaDocumento(
      {
        nombreCompleto: user?.nombreCompleto || (this.historial.length > 0 ? this.historial[0].pacienteNombreCompleto : 'Paciente'),
        dni: dniPaciente,
        obraSocial: obraSocialPaciente
      },
      this.historialFiltrado
    );
  }
}
