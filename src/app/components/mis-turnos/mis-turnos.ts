import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TurnoService } from '../../services/turno';
import { AuthService } from '../../services/auth';
import { FamiliarService, Familiar } from '../../services/familiar';

export interface TurnoPaciente {
  id: number;
  fecha: string;
  hora: string;
  profesionalNombre: string;
  especialidad: string;
  sede: string;
  estado: 'RESERVADO' | 'CANCELADO' | 'COMPLETADO' | string;
  motivoConsulta?: string;
  pacienteId?: number;
  beneficiarioNombre?: string;
  beneficiarioParentesco?: string;
  esTitular?: boolean;
}

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.css']
})
export class MisTurnosComponent implements OnInit {

  todosLosTurnos: TurnoPaciente[] = [];
  turnos: TurnoPaciente[] = [];
  familiares: Familiar[] = [];

  cargando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';
  pacienteId: number = 1;
  filtroActivo: 'TODOS' | number = 'TODOS';

  public authService = inject(AuthService);
  public router = inject(Router);
  private turnoService = inject(TurnoService);
  private familiarService = inject(FamiliarService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

  get titularId(): number {
    return this.authService.getPacienteId() || this.pacienteId || 1;
  }

  get titularNombre(): string {
    return this.authService.currentUser()?.nombreCompleto || 'Juan González';
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login-paciente']);
      return;
    }

    if (this.authService.hasRole(['MEDICO'])) {
      this.router.navigate(['/agenda']);
      return;
    }

    const dynamicPacienteId = this.authService.getPacienteId();
    if (dynamicPacienteId) {
      this.pacienteId = dynamicPacienteId;
    }
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    const idTitular = this.titularId;

    // 1. Obtener la lista de familiares a cargo del titular
    this.familiarService.listarFamiliares(idTitular).pipe(
      catchError((err) => {
        console.warn('No se pudieron obtener familiares para turnos:', err);
        return of([] as Familiar[]);
      })
    ).subscribe({
      next: (familias) => {
        this.familiares = (familias || []).filter(f => f.isActive !== false && f.isActivo !== false);

        // 2. Armar peticiones paralelas para los turnos del titular y de cada familiar activo
        const peticiones: { [key: string]: Observable<any> } = {
          titular: this.turnoService.obtenerTurnosPaciente(idTitular).pipe(
            catchError(() => of({ body: [] }))
          )
        };

        this.familiares.forEach((fam) => {
          peticiones[`familiar_${fam.id}`] = this.turnoService.obtenerTurnosPaciente(fam.id).pipe(
            catchError(() => of({ body: [] }))
          );
        });

        forkJoin(peticiones).subscribe({
          next: (resultados: any) => {
            this.cargando = false;
            const turnosAgrupados: TurnoPaciente[] = [];

            // A. Turnos del titular
            const dataTitular = (resultados.titular && resultados.titular.body !== undefined)
              ? resultados.titular.body
              : resultados.titular;
            if (Array.isArray(dataTitular)) {
              dataTitular.forEach((raw: any) => {
                turnosAgrupados.push(this.mapearTurno(raw, idTitular, this.titularNombre, 'Titular', true));
              });
            }

            // B. Turnos de cada familiar activo
            this.familiares.forEach((fam) => {
              const resFam = resultados[`familiar_${fam.id}`];
              const dataFam = (resFam && resFam.body !== undefined) ? resFam.body : resFam;
              if (Array.isArray(dataFam)) {
                dataFam.forEach((raw: any) => {
                  turnosAgrupados.push(this.mapearTurno(raw, fam.id, `${fam.nombre} ${fam.apellido}`, fam.parentesco, false));
                });
              }
            });

            // Evitar duplicados por id de turno
            const mapUnicos = new Map<number, TurnoPaciente>();
            turnosAgrupados.forEach(t => mapUnicos.set(t.id, t));
            this.todosLosTurnos = Array.from(mapUnicos.values());

            this.aplicarFiltro();
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            this.cargando = false;
            this.errorMensaje = 'No se pudieron recuperar los turnos. Intente más tarde.';
            console.error('Error al cargar turnos del grupo familiar:', err);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        this.cargando = false;
        this.errorMensaje = 'No se pudieron recuperar los turnos. Intente más tarde.';
        console.error('Error al cargar familiares:', err);
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarFiltro(filtro: 'TODOS' | number): void {
    this.filtroActivo = filtro;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (this.filtroActivo === 'TODOS') {
      this.turnos = [...this.todosLosTurnos];
    } else {
      this.turnos = this.todosLosTurnos.filter(t => t.pacienteId === this.filtroActivo);
    }
  }

  contarTurnos(filtro: 'TODOS' | number): number {
    if (filtro === 'TODOS') {
      return this.todosLosTurnos.length;
    }
    return this.todosLosTurnos.filter(t => t.pacienteId === filtro).length;
  }

  private mapearTurno(raw: any, idFallback: number, nombreBeneficiario: string, parentesco: string, esTitular: boolean): TurnoPaciente {
    let fecha = raw.fecha || '';
    let hora = raw.hora || '';
    let horaFin = '';

    // Si viene fechaHoraInicio o fechaHora
    const fechaHoraVal = raw.fechaHoraInicio || raw.fechaHora;
    if (fechaHoraVal) {
      const fechaHoraStr = fechaHoraVal.toString().replace(' ', 'T');
      const partes = fechaHoraStr.split('T');
      if (partes.length >= 1 && partes[0]) {
        const dateParts = partes[0].split('-');
        if (dateParts.length === 3) {
          fecha = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          fecha = partes[0];
        }
      }
      if (partes.length >= 2 && partes[1]) {
        hora = partes[1].substring(0, 5);
      }
    }

    if (raw.fechaHoraFin) {
      const fechaFinStr = raw.fechaHoraFin.toString().replace(' ', 'T');
      const partesFin = fechaFinStr.split('T');
      if (partesFin.length >= 2 && partesFin[1]) {
        horaFin = partesFin[1].substring(0, 5);
      }
    }

    const horarioCompleto = horaFin ? `${hora} - ${horaFin}` : hora;

    return {
      id: raw.id,
      fecha: fecha || 'A confirmar',
      hora: horarioCompleto || '--:--',
      profesionalNombre: raw.profesionalNombreCompleto || raw.profesionalNombre || 'Profesional no especificado',
      especialidad: raw.especialidadNombre || raw.especialidad || 'Especialidad general',
      sede: raw.sedeNombre || raw.sede || 'Sede no especificada',
      estado: raw.estado || 'RESERVADO',
      motivoConsulta: raw.motivoConsulta || '',
      pacienteId: raw.pacienteId || idFallback,
      beneficiarioNombre: raw.pacienteNombreCompleto || nombreBeneficiario,
      beneficiarioParentesco: parentesco,
      esTitular: esTitular
    };
  }

  solicitarCancelacion(turno: TurnoPaciente): void {
    const benefStr = turno.esTitular
      ? 'su turno'
      : `el turno de ${turno.beneficiarioNombre} (${turno.beneficiarioParentesco})`;

    const confirmacion = window.confirm(
      `¿Está seguro de que desea cancelar ${benefStr} con ${turno.profesionalNombre} (${turno.especialidad}) el ${turno.fecha} a las ${turno.hora} hs?`
    );

    if (!confirmacion) return;

    this.cargando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    this.turnoService.cancelarTurno(turno.id).subscribe({
      next: () => {
        this.cargando = false;
        turno.estado = 'CANCELADO'; // Actualización inmediata en UI
        
        const item = this.todosLosTurnos.find(t => t.id === turno.id);
        if (item) item.estado = 'CANCELADO';

        this.mensajeExito = `El turno con ${turno.profesionalNombre} fue cancelado exitosamente.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = 'Error al procesar la cancelación. Verifique la conexión con el servidor.';
        console.error('Error al cancelar turno', err);
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPaciente(id: number): void {
    if (this.authService.hasRole(['PACIENTE'])) {
      const myId = this.authService.getPacienteId();
      this.pacienteId = myId ? myId : this.pacienteId;
    } else {
      this.pacienteId = id;
    }
    this.cargarTurnos();
  }

  irABuscarTurno(): void {
    this.router.navigate(['/buscar']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}