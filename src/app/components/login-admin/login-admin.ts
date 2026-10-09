import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
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
    if (this.loginForm.valid) {
      alert('Procesando: Enviando datos al backend...');
      
      const datosLogin = {
        identificador: this.loginForm.value.legajo, 
        password: this.loginForm.value.password
      };

      this.authService.login(datosLogin).subscribe({
        next: () => {
          alert('Ingresaste como administrador');
        },
        error: (err) => {
          console.error('Detalle del error:', err);
          alert('Error de conexión o datos incorrectos. Revisa la consola.');
        }
      });
    } else {
      alert('Formulario incompleto: Por favor, ingresa tu legajo y contraseña.');
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