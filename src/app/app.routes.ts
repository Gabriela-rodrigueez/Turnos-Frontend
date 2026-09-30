import { Routes } from '@angular/router';
import { BuscarTurnoComponent } from './components/buscar-turno/buscar-turno';
import {MisTurnosComponent } from './components/mis-turnos/mis-turnos';

export const routes: Routes = [
  { path: '', component: BuscarTurnoComponent },
  { path: 'mis-turnos', component: MisTurnosComponent }
];