export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  obraSocialId?: number;
  obraSocialNombre?: string;
  numeroAfiliado?: string;
  sexo?: string;
  alertasClinicas?: string[];
  tutorId?: number;
  tutorNombreCompleto?: string;
}

export interface ReservaPresencialRequestDTO {
  pacienteId: number;
  profesionalId: number;
  especialidadId: number;
  sedeId: number;
  fechaHora: string; // ISO 8601, ej. 2026-10-15T09:30:00
  motivoConsulta?: string;
  observaciones?: string;
}

export interface NuevoPacientePresencialDTO {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: string;
  telefono: string;
  email?: string;
  obraSocialId?: number;
  obraSocialNombre?: string;
  numeroAfiliado?: string;
}

export interface TurnoHistorial {
  id: number;
  fecha: string;
  hora: string;
  profesionalNombre: string;
  especialidad: string;
  sede: string;
  consultorio?: string;
  estado: 'Confirmado' | 'Pendiente' | 'Atendido' | 'Cancelado' | string;
  motivoConsulta?: string;
}

export interface AdmisionItem {
  id: number;
  codigoTurno: string;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  especialidad: string;
  profesional: string;
  consultorio: string;
  cobertura: string;
  numeroAfiliado?: string;
  tipoPractica: string;
  formatoEmision: string;
  fechaHoraTurno: string;
  ordenDerivacion?: string;
  operadorNombre?: string;
}

export interface TotemTicket {
  numero: string;
  categoria: string;
  horaEmision: string;
  tiempoEsperaMin: number;
  enEspera: number;
}
