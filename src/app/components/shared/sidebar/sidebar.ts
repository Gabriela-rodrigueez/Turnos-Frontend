import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  get esAdmin(): boolean {
    return this.authService.hasRole(['ADMINISTRADOR', 'ADMIN']);
  }

  get esMedico(): boolean {
    return this.authService.hasRole(['MEDICO']);
  }

  get esPaciente(): boolean {
    // Si no es admin ni médico, o si tiene rol explícito PACIENTE
    return this.authService.hasRole(['PACIENTE']) || (!this.esAdmin && !this.esMedico);
  }

  get homeRoute(): string {
    if (!this.authService.isAuthenticated()) {
      return '/';
    }
    if (this.esAdmin || this.esMedico) {
      return '/agenda';
    }
    return '/mis-turnos';
  }

  get userInitials(): string {
    const nombre = this.authService.currentUser()?.nombreCompleto || 'US';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.closeSidebar.emit();
    this.router.navigate(['/']);
  }

  onNavigate(): void {
    this.closeSidebar.emit();
  }
}
