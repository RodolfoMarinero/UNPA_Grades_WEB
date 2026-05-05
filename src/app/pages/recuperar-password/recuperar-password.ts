import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPasswordComponent {
  private static readonly REQUEST_TIMEOUT_MS = 20000;
  private authService = inject(Auth);
  private router = inject(Router);

  email = '';
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  enviar() {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.email || !this.email.includes('@')) {
      this.mensajeError = 'Ingresa un correo valido';
      return;
    }

    this.cargando = true;
    this.authService.solicitarRecuperacionPassword(this.email.trim()).pipe(
      timeout(RecuperarPasswordComponent.REQUEST_TIMEOUT_MS),
      finalize(() => {
        this.cargando = false;
      })
    ).subscribe({
      next: () => {
        this.mensajeExito = 'Si el correo existe, recibiras un enlace para restablecer tu contrasena.';
      },
      error: (err) => {
        this.mensajeError = this.obtenerMensajeError(err);
      }
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
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
    return 'No se pudo procesar la solicitud.';
  }
}
