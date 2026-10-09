import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SolicitudTramite {
  id: number;
  paciente: string;
  dni: string;
  tipoTramite: string;
  fechaIngreso: string;
  tutor?: string;
  cobertura: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  documentos: Array<{ nombre: string; tipo: string; valido: boolean }>;
}

export interface OrdenDerivada {
  id: number;
  paciente: string;
  dni: string;
  estudio: string;
  profesionalSolicitante: string;
  especialidad: string;
  diagnostico: string;
  fecha: string;
  estado: 'Pendiente Auditoría' | 'Aprobada' | 'Observada';
}

@Component({
  selector: 'app-registro-validacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-validacion.html',
  styleUrls: ['./registro-validacion.css']
})
export class RegistroValidacionComponent implements OnInit {

  // Métricas
  metricas = [
    { label: 'Total Empadronados', valor: '48.290', icono: 'groups', color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Pendientes de Validación', valor: '14', icono: 'rule', color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Validados RENAPER / SISA', valor: '99.4%', icono: 'verified', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Bloqueos por Inconsistencia', valor: '3', icono: 'gpp_bad', color: 'text-rose-700', bg: 'bg-rose-50' }
  ];

  // Solicitudes
  solicitudes: SolicitudTramite[] = [
    {
      id: 1,
      paciente: 'Mateo González',
      dni: '55.333.444',
      tipoTramite: 'Vinculación de Tutor / Cobertura OSEP',
      fechaIngreso: '06/10/2026 09:15',
      tutor: 'Juan González (DNI 35.111.222)',
      cobertura: 'OSEP Mendoza (Afiliado 1-35111222/02)',
      estado: 'Pendiente',
      documentos: [
        { nombre: 'Partida de Nacimiento Digital', tipo: 'PDF Oficial', valido: true },
        { nombre: 'DNI Menor (Frente y Dorso)', tipo: 'Imagen JPG', valido: true },
        { nombre: 'Carnet Titular OSEP', tipo: 'Credencial Digital', valido: true }
      ]
    },
    {
      id: 2,
      paciente: 'Sofía Valentina Rivas',
      dni: '56.102.991',
      tipoTramite: 'Empadronamiento Recién Nacido',
      fechaIngreso: '06/10/2026 08:40',
      tutor: 'Camila Rivas (DNI 38.990.112)',
      cobertura: 'Particular / Sin Cobertura',
      estado: 'Pendiente',
      documentos: [
        { nombre: 'Certificado de Nacido Vivo Hospitalario', tipo: 'PDF Sellado', valido: true },
        { nombre: 'DNI Madre', tipo: 'Imagen JPG', valido: true }
      ]
    },
    {
      id: 3,
      paciente: 'Bautista Giménez',
      dni: '42.881.002',
      tipoTramite: 'Actualización Carnet OSEP / Discapacidad',
      fechaIngreso: '05/10/2026 16:30',
      cobertura: 'OSEP Mendoza',
      estado: 'Pendiente',
      documentos: [
        { nombre: 'Certificado Único de Discapacidad (CUD)', tipo: 'PDF SISA', valido: true },
        { nombre: 'Informe Médico Especialista', tipo: 'PDF', valido: true }
      ]
    }
  ];

  solicitudSeleccionada: SolicitudTramite = this.solicitudes[0];
  docActivoIndex: number = 0;

  // Checklist interactivo
  checkRenaper: boolean = true;
  checkVinculo: boolean = true;
  checkCobertura: boolean = true;

  // Órdenes Derivadas
  ordenes: OrdenDerivada[] = [
    {
      id: 201,
      paciente: 'Carlos Alberto Miranda',
      dni: '24.110.892',
      estudio: 'Resonancia Magnética de Cerebro c/ Contraste',
      profesionalSolicitante: 'Dr. Roberto Rossi',
      especialidad: 'Neurología / Cardiología',
      diagnostico: 'ACV Isquémico Transitorio en estudio',
      fecha: '06/10/2026',
      estado: 'Pendiente Auditoría'
    },
    {
      id: 202,
      paciente: 'Graciela Noemí Soto',
      dni: '30.491.220',
      estudio: 'Polisomnografía Nocturna con Titulación',
      profesionalSolicitante: 'Dra. María Gómez',
      especialidad: 'Neumonología',
      diagnostico: 'Apnea Obstructiva del Sueño Severa',
      fecha: '05/10/2026',
      estado: 'Pendiente Auditoría'
    },
    {
      id: 203,
      paciente: 'Esteban Darío Lucero',
      dni: '39.882.110',
      estudio: 'Video Endoscopía Digestiva Alta (VEDA)',
      profesionalSolicitante: 'Dr. Carlos Rodríguez',
      especialidad: 'Gastroenterología',
      diagnostico: 'Hemorragia Digestiva Alta remitida',
      fecha: '04/10/2026',
      estado: 'Aprobada'
    }
  ];

  // Modal Alta Manual Excepcional
  modalAltaExcepcional: boolean = false;
  altaManualDni: string = '';
  altaManualNombre: string = '';
  altaManualMotivo: string = 'Indocumentado en trámite RENAPER';
  mensajeExito: string = '';

  ngOnInit(): void {
    this.seleccionarSolicitud(this.solicitudes[0]);
  }

  seleccionarSolicitud(s: SolicitudTramite): void {
    this.solicitudSeleccionada = s;
    this.docActivoIndex = 0;
    this.checkRenaper = true;
    this.checkVinculo = true;
    this.checkCobertura = true;
    this.mensajeExito = '';
  }

  aprobarTramite(): void {
    this.solicitudSeleccionada.estado = 'Aprobado';
    this.mensajeExito = `¡Trámite de ${this.solicitudSeleccionada.paciente} aprobado con éxito en Padrón Único Provincial!`;
  }

  rechazarTramite(): void {
    const motivo = prompt('Ingrese el motivo de observación o rechazo documental:', 'Falta sello legible en partida de nacimiento');
    if (motivo) {
      this.solicitudSeleccionada.estado = 'Rechazado';
      this.mensajeExito = `Trámite observado y notificado al ciudadano por WhatsApp / Email.`;
    }
  }

  aprobarOrden(o: OrdenDerivada): void {
    o.estado = 'Aprobada';
  }

  abrirAltaManual(): void {
    this.modalAltaExcepcional = true;
    this.altaManualDni = '';
    this.altaManualNombre = '';
  }

  cerrarAltaManual(): void {
    this.modalAltaExcepcional = false;
  }

  guardarAltaManual(): void {
    if (!this.altaManualDni || !this.altaManualNombre) {
      alert('Complete DNI y Nombre para el alta manual.');
      return;
    }
    this.modalAltaExcepcional = false;
    alert(`Paciente ${this.altaManualNombre} (DNI ${this.altaManualDni}) empadronado por vía de excepción.`);
  }
}
