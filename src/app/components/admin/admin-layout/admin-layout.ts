import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayoutComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  sedesList: string[] = [
    'Hospital Central de Mendoza',
    'Hospital Luis Lagomaggiore',
    'Hospital Pediátrico Humberto Notti',
    'Hospital Diego Paroissien',
    'CAPS N° 16 Godoy Cruz'
  ];
  sedeSeleccionada: string = 'Hospital Central de Mendoza';

  operadorNombre: string = 'Lic. Mariana García';
  operadorLegajo: string = 'Adm. #8841';
  pendientesValidacion: number = 14;

  horaActual: string = '';
  private timerReloj: any;

  ngOnInit(): void {
    this.iniciarReloj();
    const user = this.authService.currentUser();
    if (user?.nombreCompleto) {
      this.operadorNombre = user.nombreCompleto;
      if (user.legajo) {
        this.operadorLegajo = `Adm. #${user.legajo}`;
      }
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

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  cambiarRolPrueba(rol: 'ADMIN' | 'MEDICO' | 'PACIENTE'): void {
    if (rol === 'ADMIN') {
      this.authService.loginAsAdmin();
    } else if (rol === 'MEDICO') {
      this.authService.loginAsMedico();
    } else {
      this.authService.loginAsPaciente(1);
      this.router.navigate(['/']);
    }
  }
}
