import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = false;
  horaActual = '';
  private timerReloj: any;

  ngOnInit(): void {
    this.iniciarReloj();
  }

  ngOnDestroy(): void {
    if (this.timerReloj) {
      clearInterval(this.timerReloj);
    }
  }

  private iniciarReloj(): void {
    const updateTime = () => {
      const now = new Date();
      this.horaActual = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };
    updateTime();
    this.timerReloj = setInterval(updateTime, 1000);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.closeSidebar();
    this.router.navigate(['/']);
  }
}
