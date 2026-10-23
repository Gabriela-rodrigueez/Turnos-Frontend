import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  mensajeError: string = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    this.mensajeError = '';
    if (this.loginForm.valid) {
      this.cargando = true;
      const datosLogin = {
        matricula: this.loginForm.value.matricula, 
        password: this.loginForm.value.password
      };

      this.authService.login(datosLogin).subscribe({
        next: () => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.router.navigate(['/agenda']);
        },
        error: (err) => {
          this.cargando = false;
          if (err.status === 401) {
            this.mensajeError = 'Credenciales incorrectas. Verifique su matrícula y contraseña.';
          } else {
            this.mensajeError = 'Error al comunicarse con el servidor. Intente nuevamente.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.mensajeError = 'Por favor, complete su matrícula y contraseña.';
      this.cdr.detectChanges();
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