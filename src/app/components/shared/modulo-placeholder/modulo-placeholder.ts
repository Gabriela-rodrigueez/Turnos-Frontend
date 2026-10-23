import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-modulo-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto py-10 px-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
        
        <!-- Icono / Badge -->
        <div class="w-16 h-16 rounded-2xl bg-blue-50 text-[#004a8a] flex items-center justify-center mx-auto text-3xl font-bold shadow-xs">
          {{ icono }}
        </div>

        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
          <span>⚙️ Módulo en Desarrollo</span>
          <span>•</span>
          <span>{{ issue }}</span>
        </div>

        <!-- Título y Descripción -->
        <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {{ titulo }}
        </h2>
        
        <p class="text-sm text-slate-600 max-w-lg mx-auto">
          {{ descripcion }}
        </p>

        <!-- Rol Requerido -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-xs text-left space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Rol asignado:</span>
            <span class="font-bold text-[#004a8a]">{{ rol }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700">Estado de especificación:</span>
            <span class="font-bold text-emerald-700">Issue definido y listo para desarrollo</span>
          </div>
        </div>

        <!-- Botón de retorno al panel -->
        <div class="pt-4">
          <a [routerLink]="homeRoute" class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#004a8a] hover:bg-[#00386b] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer">
            <span>← Volver al Panel</span>
          </a>
        </div>

      </div>
    </div>
  `
})
export class ModuloPlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  titulo: string = 'Módulo Hospitalario';
  issue: string = 'v2';
  icono: string = '🏥';
  rol: string = 'ADMINISTRADOR';
  descripcion: string = 'Este módulo ha sido definido en los requerimientos institucionales y se encuentra listo para su implementación.';

  get homeRoute(): string {
    if (!this.authService.isAuthenticated()) return '/';
    const rol = this.authService.getRol();
    return (rol === 'ADMINISTRADOR' || rol === 'ADMIN' || rol === 'MEDICO') ? '/agenda' : '/mis-turnos';
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['titulo']) this.titulo = data['titulo'];
    if (data['issue']) this.issue = data['issue'];
    if (data['icono']) this.icono = data['icono'];
    if (data['rol']) this.rol = data['rol'];
    if (data['descripcion']) this.descripcion = data['descripcion'];
  }
}
