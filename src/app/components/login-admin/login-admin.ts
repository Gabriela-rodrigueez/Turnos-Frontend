import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login-admin.html'
})
export class LoginAdminComponent {
  loginForm: FormGroup;
  mostrarClave = false;
  mensajeError: string = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      legajo: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  toggleClave() {
    this.mostrarClave = !this.mostrarClave;
  }

  iniciarSesion() {
    this.mensajeError = '';
    if (this.loginForm.valid) {
      this.cargando = true;
      const datosLogin = {
        legajo: this.loginForm.value.legajo, 
        password: this.loginForm.value.password
      };

      this.authService.login(datosLogin).subscribe({
        next: () => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.router.navigate(['/mis-turnos']);
        },
        error: (err) => {
          this.cargando = false;
          if (err.status === 401) {
            this.mensajeError = 'Credenciales incorrectas. Verifique su legajo y contraseña.';
          } else {
            this.mensajeError = 'Error al comunicarse con el servidor. Intente nuevamente.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.mensajeError = 'Por favor, complete su legajo y contraseña.';
      this.cdr.detectChanges();
    }
  }

  // Función para recuperar contraseña del administrador
  recuperarClave(event: Event) {
    event.preventDefault(); 
    
    const emailRecuperacion = window.prompt("Ingrese el correo electrónico del departamento de administración para recibir las instrucciones:");
    
    if (emailRecuperacion) {
      alert(`Se han enviado las instrucciones a: ${emailRecuperacion}\n\nPor favor, revise la bandeja de entrada del sistema.`);
    }
  }
}