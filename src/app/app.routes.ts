import { Routes } from '@angular/router';
import { PortalComponent } from './components/portal/portal';
import { RegistroComponent } from './components/registro/registro'; 
import { LoginPacienteComponent } from './components/login-paciente/login-paciente';
import { LoginMedicoComponent } from './components/login-medico/login-medico';
import { LoginAdminComponent } from './components/login-admin/login-admin';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';
import { GrupoFamiliarComponent } from './components/grupo-familiar/grupo-familiar';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout';
import { PanelPrincipalComponent } from './components/admin/panel-principal/panel-principal';
import { NuevaCitaComponent } from './components/admin/nueva-cita/nueva-cita';
import { RegistroValidacionComponent } from './components/admin/registro-validacion/registro-validacion';
import { AgendaComponent } from './components/admin/agenda/agenda';
import { MainLayoutComponent } from './components/shared/main-layout/main-layout';
import { ModuloPlaceholderComponent } from './components/shared/modulo-placeholder/modulo-placeholder';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { NoMedicoGuard } from './guards/no-medico.guard';

export const routes: Routes = [
  // Rutas públicas de entrada (Portal Ciudadano y Autenticación)
  { path: '', component: PortalComponent, pathMatch: 'full' },
  { path: 'login-paciente', component: LoginPacienteComponent },
  { path: 'login-medico', component: LoginMedicoComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'registro', component: RegistroComponent },

  // Shell Común de Navegación con Sidenav Lateral
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Rutas Paciente / Atención
      { path: 'buscar', component: BuscarTurnoComponent, canActivate: [NoMedicoGuard] },
      { path: 'mis-turnos', component: MisTurnosComponent, canActivate: [AuthGuard] },
      { path: 'perfil/familiares', component: GrupoFamiliarComponent, canActivate: [AuthGuard] },
      { path: 'familiares', redirectTo: 'perfil/familiares', pathMatch: 'full' },
      { 
        path: 'mi-historial', 
        component: ModuloPlaceholderComponent, 
        canActivate: [AuthGuard],
        data: {
          titulo: 'Mi Historia Clínica y Recetas Digitales',
          issue: 'F-11',
          icono: '📁',
          rol: 'PACIENTE / MÉDICO',
          descripcion: 'Consulta de evolución clínica, recetas digitales con código de farmacia y descarga de estudios médicos en formato PDF.'
        }
      },

      // Gestión de Agenda y Consultas Médicas
      { path: 'agenda', component: AgendaComponent, canActivate: [AdminGuard] },
      { path: 'admin/agenda', redirectTo: 'agenda', pathMatch: 'full' },
      { 
        path: 'medico/consultas', 
        component: ModuloPlaceholderComponent, 
        canActivate: [AdminGuard],
        data: {
          titulo: 'Atención Médica y Registro de Evolución Clínica',
          issue: 'F-11',
          icono: '🩺',
          rol: 'MEDICO',
          descripcion: 'Panel de consultorio para gestionar citas del día, redactar notas de evolución, emitir recetas digitales y solicitar estudios clínicos.'
        }
      },

      // Rutas Módulo Administrativo
      { path: 'admin', redirectTo: 'agenda', pathMatch: 'full' },
      { path: 'admin/panel-principal', component: PanelPrincipalComponent, canActivate: [AdminGuard] },
      { path: 'admin/nueva-cita', component: NuevaCitaComponent, canActivate: [AdminGuard] },
      { path: 'admin/registro-validacion', component: RegistroValidacionComponent, canActivate: [AdminGuard] },

      // Catálogos Maestros (Nuevas Tareas v2)
      { 
        path: 'admin/profesionales', 
        component: ModuloPlaceholderComponent, 
        canActivate: [AdminGuard],
        data: {
          titulo: 'Alta y Gestión de Profesionales Médicos',
          issue: 'F-09',
          icono: '🩺',
          rol: 'ADMINISTRADOR',
          descripcion: 'Registro de profesionales médicos, gestión de matrículas provinciales y asignación de especialidades.'
        }
      },
      { 
        path: 'admin/especialidades', 
        component: ModuloPlaceholderComponent, 
        canActivate: [AdminGuard],
        data: {
          titulo: 'Alta y Gestión de Especialidades Médicas',
          issue: 'F-12',
          icono: '🔬',
          rol: 'ADMINISTRADOR',
          descripcion: 'Registro de nuevas ramas de la salud, descripciones clínicas y actualización de la cartilla hospitalaria.'
        }
      },
      { 
        path: 'admin/obras-sociales', 
        component: ModuloPlaceholderComponent, 
        canActivate: [AdminGuard],
        data: {
          titulo: 'Alta y Gestión de Obras Sociales y Prepagas',
          issue: 'F-10',
          icono: '🏥',
          rol: 'ADMINISTRADOR',
          descripcion: 'Padrón de prestadoras de salud, convenios, coberturas y configuración de copagos.'
        }
      }
    ]
  },

  // Redirecciones explícitas de autenticación hacia rutas existentes
  { path: 'auth/registro-paciente', redirectTo: 'registro' },
  { path: 'auth/registro', redirectTo: 'registro' },
  { path: 'registro-paciente', redirectTo: 'registro' },
  { path: 'login', redirectTo: 'login-paciente' },
  { path: 'auth/login', redirectTo: 'login-paciente' },

  // Ruta comodín ante URLs no coincidentes
  { path: '**', redirectTo: '' }
];
