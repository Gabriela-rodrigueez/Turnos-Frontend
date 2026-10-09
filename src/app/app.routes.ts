import { Routes } from '@angular/router';
import { PortalComponent } from './components/portal/portal';
import { RegistroComponent } from './components/registro/registro'; 
import { LoginPacienteComponent } from './components/login-paciente/login-paciente';
import { LoginMedicoComponent } from './components/login-medico/login-medico';
import { LoginAdminComponent } from './components/login-admin/login-admin';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout';
import { PanelPrincipalComponent } from './components/admin/panel-principal/panel-principal';
import { NuevaCitaComponent } from './components/admin/nueva-cita/nueva-cita';
import { RegistroValidacionComponent } from './components/admin/registro-validacion/registro-validacion';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Rutas públicas del Portal Ciudadano
  { path: '', component: PortalComponent, pathMatch: 'full' },
  { path: 'login-paciente', component: LoginPacienteComponent },
  { path: 'login-medico', component: LoginMedicoComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'buscar', component: BuscarTurnoComponent },
  { path: 'mis-turnos', component: MisTurnosComponent },

  // Módulo Administrativo: Shell Común con Rutas Hijas (Layout con Header y Sidebar fijos)
  { 
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'panel-principal', pathMatch: 'full' },
      { path: 'panel-principal', component: PanelPrincipalComponent },
      { path: 'nueva-cita', component: NuevaCitaComponent },
      { path: 'registro-validacion', component: RegistroValidacionComponent }
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

