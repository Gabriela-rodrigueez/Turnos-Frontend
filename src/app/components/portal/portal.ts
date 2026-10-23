import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [RouterModule], 
  templateUrl: './portal.html',
  styleUrl: './portal.css'
})
export class PortalComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const rol = this.authService.getRol();
      if (rol === 'ADMINISTRADOR' || rol === 'ADMIN' || rol === 'MEDICO') {
        this.router.navigate(['/agenda']);
      } else {
        this.router.navigate(['/mis-turnos']);
      }
    }
  }
}