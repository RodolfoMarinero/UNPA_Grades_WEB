import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { Location } from '@angular/common'; // Importar Location
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-password.html',
  styleUrl: './cambiar-password.css'
})
export class CambiarPassword {

  private authService = inject(Auth);
  private router = inject(Router);
  private location = inject(Location); // Inyectar Location
  private route = inject(ActivatedRoute);

  // --- VARIABLES DE CLASE (El HTML las busca aquí) ---
  mensajeError: string = '';
  mensajeExito: string = '';
  cargando: boolean = false;

  passActual: string = '';
  passNueva: string = '';
  passConfirmacion: string = '';

  mostrarActual: boolean = false;
  mostrarNueva: boolean = false;
  mostrarConfirmacion: boolean = false;

  esPrimerAcceso: boolean = false;
  matriculaUrl: string = '';
  // --------------------------------------------------

  ngOnInit() {
    // Verificamos si venimos del login por primer acceso
    // @ts-ignore
    this.route.queryParams.subscribe(params => {
      this.esPrimerAcceso = params['primerAcceso'] === 'true';
      this.matriculaUrl = params['id'] || '';

      if (this.esPrimerAcceso) {
        // Autocompletamos la contraseña actual con la matrícula
        const matricula = this.authService.alumnoActual?.matricula || '';
        this.passActual = matricula;
      }
    });
  }

  cambiar() {
    this.mensajeError = '';
    this.mensajeExito = '';

    // 1. OBTENER MATRÍCULA (Del servicio o de la URL)
    const matriculaGuardada = localStorage.getItem('matricula');

    const matricula = matriculaGuardada || this.authService.alumnoActual?.matricula || this.matriculaUrl;

    if (!matricula) {
      this.mensajeError = 'Error: No se pudo identificar al usuario.';
      return;
    }

    // 2. LOGICA DE PRIMER ACCESO (¡AQUÍ ESTÁ LA SOLUCIÓN!)
    // Si es primer acceso, la "Contraseña Actual" ES la matrícula.
    // La asignamos manualmente aquí porque el usuario no tiene el campo para escribirla.
    if (this.esPrimerAcceso) {
      this.passActual = matricula;
    }

    // 3. AHORA SÍ, VALIDAMOS
    // Como ya llenamos 'passActual' arriba, esta validación pasará correctamente
    if (!this.passActual || !this.passNueva || !this.passConfirmacion) {
      this.mensajeError = 'Completa todos los campos';
      return;
    }

    // Validación: Nueva vs Confirmación
    if(!this.esPrimerAcceso) {
      if (this.passNueva !== this.passConfirmacion) {
        this.mensajeError = 'La nueva contraseña no coincide con la confirmación';
        return;
      }
    }
    // Validación: Longitud mínima
    if (this.passNueva.length < 6) {
      this.mensajeError = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }

    // Validación: Que no ponga la misma contraseña (matricula) otra vez
    if (this.passActual === this.passNueva) {
      this.mensajeError = 'La nueva contraseña debe ser distinta a la actual';
      return;
    }

    if(this.passNueva !== this.passConfirmacion){
      this.mensajeError = 'La nueva contraseña no coincide';
      return;
    }

    // 4. ENVIAR AL SERVICIO
    this.cargando = true;

    this.authService.cambiarPassword(matricula, this.passActual, this.passNueva)
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.mensajeExito = 'Contraseña actualizada correctamente';

          if (this.esPrimerAcceso) {
            // Si era primer acceso, ir al Home después de 1.5 seg
            setTimeout(() => this.router.navigate(['/home']), 1500);
          } else {
            // Si era cambio normal, regresar
            setTimeout(() => this.location.back(), 1500);
          }
        },
        error: (err) => {
          this.cargando = false;
          this.mensajeError = err.error?.message || 'Error al actualizar. Intenta de nuevo.';
        }
      });
  }

  cancelar() {
    this.location.back();
  }

  toggleActual() { this.mostrarActual = !this.mostrarActual; }
  toggleNueva() { this.mostrarNueva = !this.mostrarNueva; }
  toggleConfirmacion() { this.mostrarConfirmacion = !this.mostrarConfirmacion; }
}
