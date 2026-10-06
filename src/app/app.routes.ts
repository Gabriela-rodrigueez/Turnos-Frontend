import { Routes } from '@angular/router';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';
import { AdminComponent } from './components/admin/admin';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Ruta por defecto: Carga la vista principal del buscador de turnos
  { path: '', component: BuscarTurnoComponent, pathMatch: 'full' },
  
  // Rutas del portal de pacientes
  { path: 'mis-turnos', component: MisTurnosComponent },

  // Ruta administrativa y mostrador protegida con AdminGuard
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [AdminGuard] 
  },

  // Redirecciones explícitas de rutas de autenticación y registro hacia rutas existentes del proyecto
  { path: 'auth/registro-paciente', redirectTo: '' },
  { path: 'auth/registro', redirectTo: '' },
  { path: 'registro-paciente', redirectTo: '' },
  { path: 'registro', redirectTo: '' },
  { path: 'login', redirectTo: '' },
  { path: 'auth/login', redirectTo: '' },

  // Ruta comodín para capturar cualquier URL desconocida y evitar pantalla en blanco
  { path: '**', redirectTo: '' }
];