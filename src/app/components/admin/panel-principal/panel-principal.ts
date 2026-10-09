import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin';
import { AuthService } from '../../../services/auth';
import { AdmisionItem, TotemTicket } from '../../../../models/admin.model';

@Component({
  selector: 'app-panel-principal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './panel-principal.html',
  styleUrls: ['./panel-principal.css']
})
export class PanelPrincipalComponent implements OnInit {
  private adminService = inject(AdminService);
  public authService = inject(AuthService);

  operadorNombre: string = 'Lic. Mariana García';

  // 5 KPIs
  kpis = [
    { titulo: 'Turnos del Día', valor: '1.420', cambio: '+4.5% vs ayer', icono: 'event_available', color: 'text-sky-700', bg: 'bg-sky-50' },
    { titulo: 'Tasa de Ausentismo', valor: '11.2%', cambio: '-1.8% optimizado', icono: 'person_cancel', color: 'text-amber-700', bg: 'bg-amber-50' },
    { titulo: 'Validación Pendiente', valor: '14', cambio: 'Requiere revisión', icono: 'pending_actions', color: 'text-rose-700', bg: 'bg-rose-50' },
    { titulo: 'Lista de Espera', valor: '342', cambio: 'Especialidades críticas', icono: 'hourglass_top', color: 'text-purple-700', bg: 'bg-purple-50' },
    { titulo: 'Farmacia / Despacho', valor: '94%', cambio: 'Stock operativo', icono: 'medication', color: 'text-emerald-700', bg: 'bg-emerald-50' }
  ];

  // Tótem en vivo
  totemTurnos = [
    { turno: 'A-108', ventanilla: 'Ventanilla 3', tipo: 'Trámite Presencial / Admisión', tiempo: '02:15 min' },
    { turno: 'C-042', ventanilla: 'Ventanilla 1', tipo: 'Turno Prioritario OSEP', tiempo: '01:40 min' },
    { turno: 'B-015', ventanilla: 'Ventanilla 2', tipo: 'Extracciones / Laboratorio', tiempo: '03:10 min' }
  ];

  ultimasAdmisiones: AdmisionItem[] = [];

  // Trámites de validación para la columna derecha
  tramitesPendientes = [
    { paciente: 'Mateo González', dni: '55.333.444', tramite: 'Vinculación de Tutor / OSEP', estado: 'Pendiente' },
    { paciente: 'Sofía Valentina Rivas', dni: '56.102.991', tramite: 'Empadronamiento RN (Partida)', estado: 'Auditoría' },
    { paciente: 'Bautista Giménez', dni: '42.881.002', tramite: 'Actualización Carnet OSEP', estado: 'Revisión' }
  ];

  // Alertas de farmacia
  alertasFarmacia = [
    { medicamento: 'Insulina NPH 100 UI/ml', nivel: 'Crítico (12 u.)', badge: 'Urgente' },
    { medicamento: 'Amoxicilina + Clavulánico 875/125', nivel: 'Stock Bajo (45 u.)', badge: 'Atención' },
    { medicamento: 'Agujas descartables 21G', nivel: 'Stock Óptimo', badge: 'Normal' }
  ];

  // Modal para reimprimir ticket térmico
  modalTicketAbierto: boolean = false;
  ticketActivo: AdmisionItem | null = null;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.nombreCompleto) {
      this.operadorNombre = user.nombreCompleto;
    }
    this.ultimasAdmisiones = this.adminService.getUltimasAdmisiones();
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
}
