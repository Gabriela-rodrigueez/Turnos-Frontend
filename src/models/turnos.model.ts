export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  especialidadId: number;
}

export interface Sede {
  id: number;
  nombre: string;
}

export interface Turno {
  id: number;
  fechaHora: string;
  profesionalId: number;
  sedeId: number;
  estado: 'DISPONIBLE' | 'RESERVADO';
}