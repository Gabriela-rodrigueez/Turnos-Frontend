import { Routes } from '@angular/router';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout';
import { PanelPrincipalComponent } from './components/admin/panel-principal/panel-principal';
import { NuevaCitaComponent } from './components/admin/nueva-cita/nueva-cita';
import { RegistroValidacionComponent } from './components/admin/registro-validacion/registro-validacion';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Ruta por defecto: Portal Ciudadano de Turnos
  { path: '', component: BuscarTurnoComponent, pathMatch: 'full' },
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
  { path: 'auth/registro-paciente', redirectTo: '' },
  { path: 'auth/registro', redirectTo: '' },
  { path: 'registro-paciente', redirectTo: '' },
  { path: 'registro', redirectTo: '' },
  { path: 'login', redirectTo: '' },
  { path: 'auth/login', redirectTo: '' },

  // Ruta comodín ante URLs no coincidentes
  { path: '**', redirectTo: '' }
];