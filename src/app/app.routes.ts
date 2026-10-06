import { Routes } from '@angular/router';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos';
import { AdminComponent } from './components/admin/admin';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: BuscarTurnoComponent },
  { path: 'mis-turnos', component: MisTurnosComponent },
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [AdminGuard] 
  },
  { path: '**', redirectTo: '' }
];