import { Component } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
    if (this.loginForm.valid) {
      
      const datosLogin = {
        dni: this.loginForm.value.dni, // Cambiado de 'identificador' a 'dni'
        password: this.loginForm.value.password
      };

      this.authService.login(datosLogin).subscribe({
        next: () => {
          alert('Ingresaste como paciente');
          this.router.navigate(['/dashboard-paciente']); // O la ruta a donde deba ir
        },
        error: (err) => {
          console.error('Detalle del error:', err);
          alert('Error de conexión o datos incorrectos. Revisa que tu DNI y contraseña sean correctos.');
        }
      });
    } else {
      alert('Formulario incompleto: Por favor, ingresa tu DNI y contraseña.');
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