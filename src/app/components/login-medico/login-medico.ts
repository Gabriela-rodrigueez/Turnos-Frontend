import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-login-medico',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login-medico.html'
})
export class LoginMedicoComponent {
  loginForm: FormGroup;
  mostrarClave = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      matricula: ['', Validators.required],
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
        identificador: this.loginForm.value.matricula, 
        password: this.loginForm.value.password
      };

      this.authService.login(datosLogin).subscribe({
        next: () => {
          alert('Ingresaste como profesional médico');
        },
        error: (err) => {
          console.error('Detalle del error:', err);
          alert('Error de conexión o datos incorrectos. Revisa la consola.');
        }
      });
    } else {
      alert('Formulario incompleto: Por favor, ingresa tu matrícula y contraseña.');
    }
  }

  // Recuperación de contraseña 
  recuperarClave(event: Event) {
    event.preventDefault(); // Evita que la página salte hacia arriba
    
    
    const emailRecuperacion = window.prompt("Por favor, ingrese su correo institucional para recibir las instrucciones de recuperación:");
    
    if (emailRecuperacion) {
      alert(`Se han enviado las instrucciones a: ${emailRecuperacion}\n\nPor favor, revise su bandeja de entrada corporativa.`);
    }
  }
}