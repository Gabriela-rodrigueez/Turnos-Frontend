import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], 
  templateUrl: './registro.html'
})
export class RegistroComponent {
  registroForm: FormGroup;
  
  // Variables independientes para cada ojito
  mostrarClave = false;
  mostrarConfirmarClave = false;

  // Validador colocado antes del constructor para que Angular lo lea correctamente
  passwordsCoinciden: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirm_password = control.get('confirm_password')?.value;
    
    return password === confirm_password ? null : { passwordsMismatch: true };
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cuil: ['', [Validators.required, Validators.minLength(11)]], 
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required], 
      dob: [''],
      gender: [''],
      has_insurance: ['si'],
      provider: [''],
      affiliate_num: [''],
      plan: ['']
    }, { validators: this.passwordsCoinciden }); 
  }

  // Función para el primer ojito
  toggleClave() {
    this.mostrarClave = !this.mostrarClave;
  }
  
  // Función para el segundo ojito
  toggleConfirmarClave() {
    this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }
  
  registrar() {
    if (this.registroForm.valid) {
      this.authService.registrarPaciente(this.registroForm.value).subscribe({
        next: () => {
          alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
          this.router.navigate(['/login-paciente']);
        },
        error: (err: any) => {
          console.error('Error en el registro', err);
          alert('Hubo un problema al registrar el paciente.');
        }
      });
    } else {
      alert('Formulario incompleto: Revisa que el CUIL tenga 11 números, que las contraseñas coincidan y la clave tenga al menos 6 caracteres.');
    }
  }
}