import { Component, inject } from '@angular/core'; // <--- Agrega inject
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth'; // <--- Importar tu servicio
import { Router } from '@angular/router'; // Para navegar si el login es correcto

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  // Inyectamos el servicio de Auth y el Router
  private authService = inject(Auth);
  private router = inject(Router);

  matricula: string = '';
  password: string = '';
  passwordVisible: boolean = false;

  onLogin() {
    // 1. Validar que no estén vacíos
    if (!this.matricula || !this.password) {
      alert('Por favor llena todos los campos');
      return;
    }

    console.log('Enviando datos a Spring Boot...');

    // 2. Llamar al backend
    // @ts-ignore
    this.authService.login(this.matricula, this.password).subscribe({
      next: (respuesta) => {
        // SI TODO SALE BIEN (Código 200 OK)
        console.log('¡Login Exitoso!', respuesta);

        // Guardamos el token que nos manda Java
        if (respuesta.token) {
          localStorage.setItem('token', respuesta.token);
        }

        localStorage.setItem('matricula', this.matricula);

        // LOGICA DE PRIMER ACCESO
        // Si la contraseña es igual a la matrícula, es su primer acceso
        if (this.matricula === this.password) {
          // Redirigimos a cambiar password con una "marca" especial
          this.router.navigate(['/cambiar-password'], { queryParams: { primerAcceso: true, id: this.matricula} });
        } else {
          // Acceso normal
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        // SI ALGO SALE MAL (Código 401 o 500)
        console.error('Error:', error);

        if (error.status === 401) {
          alert('Credenciales incorrectas. Verifica tu matrícula o contraseña.');
        } else {
          alert('Error de conexión con el servidor. ¿Está encendido Spring Boot?');
        }
      }
    });
  }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }
}
