import { Routes } from '@angular/router';
import { PortalComponent } from './components/portal/portal';
import { RegistroComponent } from './components/registro/registro'; 
import { LoginPacienteComponent } from './components/login-paciente/login-paciente';
import { LoginMedicoComponent } from './components/login-medico/login-medico';
import { LoginAdminComponent } from './components/login-admin/login-admin';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';

export const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'login-paciente', component: LoginPacienteComponent },
  { path: 'login-medico', component: LoginMedicoComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'buscar', component: BuscarTurnoComponent },
  { path: 'mis-turnos', component: MisTurnosComponent }
];
