import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-login-paciente',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], 
  templateUrl: './login-paciente.html',
  styleUrl: './login-paciente.css'
})
export class LoginPacienteComponent {
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
      dni: ['', Validators.required], 
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
        dni: this.loginForm.value.dni,
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
            this.mensajeError = 'Credenciales incorrectas. Verifique su DNI y contraseña.';
          } else {
            this.mensajeError = 'Error al comunicarse con el servidor. Intente nuevamente.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.mensajeError = 'Por favor, complete su DNI y contraseña.';
      this.cdr.detectChanges();
    }
  }

  // Recuperación de contraseña
  recuperarClave(event: Event) {
    event.preventDefault(); // Evita que la página se recargue
    
    // Muestra una ventana de navegador pidiendo el correo
    const emailRecuperacion = window.prompt("Por favor, ingrese el correo electrónico asociado a su cuenta para recibir las instrucciones de recuperación:");
    
    if (emailRecuperacion) {
      // Simula el envío al backend
      alert(`Se han enviado las instrucciones de recuperación a: ${emailRecuperacion}\n\nPor favor, revise su bandeja de entrada (y la carpeta de spam).`);
    }
  }
}