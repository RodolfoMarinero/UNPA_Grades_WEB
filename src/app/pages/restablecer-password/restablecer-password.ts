import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restablecer-password.html',
  styleUrl: './restablecer-password.css'
})
export class RestablecerPasswordComponent {
  private static readonly REQUEST_TIMEOUT_MS = 20000;
  private authService = inject(Auth);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  passwordNueva = '';
  passwordConfirmacion = '';
  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  enviar() {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.token) {
      this.mensajeError = 'El enlace no es valido o no contiene token.';
      return;
    }
    if (!this.passwordNueva || this.passwordNueva.length < 6) {
      this.mensajeError = 'La nueva contrasena debe tener al menos 6 caracteres.';
      return;
    }
    if (this.passwordNueva !== this.passwordConfirmacion) {
      this.mensajeError = 'La confirmacion no coincide con la contrasena.';
      return;
    }

    this.cargando = true;
    this.authService.restablecerPassword(this.token, this.passwordNueva).pipe(
      timeout(RestablecerPasswordComponent.REQUEST_TIMEOUT_MS),
      finalize(() => {
        this.cargando = false;
      })
    ).subscribe({
      next: () => {
        this.mensajeExito = 'Contrasena actualizada. Ya puedes iniciar sesion.';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.mensajeError = this.obtenerMensajeError(err);
      }
    });
  }

  private obtenerMensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (typeof err.error === 'string' && err.error.trim().length > 0) {
        return err.error;
      }
      if (err.status === 0) {
        return 'No se pudo conectar con el servidor. Verifica que el backend este encendido.';
      }
      if (err.status >= 500) {
        return 'El servidor no pudo procesar la solicitud. Intenta de nuevo en un momento.';
      }
    }
    if (err instanceof Error && err.name === 'TimeoutError') {
      return 'El servidor tardo demasiado en responder. Intenta nuevamente.';
    }
    return 'No se pudo restablecer la contrasena.';
  }
}
