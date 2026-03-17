import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AlumnoData } from '../../interfaces/alumno';
import {CodigoBarrasComponent} from '../../components/codigo-barras/codigo-barras'; // <--- Usamos TU interfaz

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, CodigoBarrasComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {

  private authService = inject(Auth);
  private router = inject(Router);

  // Usamos AlumnoData tal cual lo tienes
  alumno: AlumnoData | null = null;
  promedioGeneral: number = 0.0;

  ngOnInit() {
    // Intentamos obtener el alumno guardado en memoria
    this.alumno = this.authService.alumnoActual;

    // Si por alguna razón es null (ej. recargaron la página), los mandamos al home para que recarguen
    if (!this.alumno) {
      this.router.navigate(['/home']);
      return;
    }

    this.calcularPromedio();
  }

  calcularPromedio() {
    if (!this.alumno || !this.alumno.materias) return;

    let sumaPromedios = 0;
    let materiasContadas = 0;

    this.alumno.materias.forEach(m => {
      // Si quieres filtrar materias inactivas (opcional): if (!m.activo) return;

      const cal = m.calificaciones;
      let notaFinal = 0;

      // 1. Obtener valores seguros (convirtiendo nulos a 0)
      const pFinal = Number(cal.pfinal) || 0;
      const ordinario = Number(cal.ordinario) || 0;
      const p1 = Number(cal.parcial1) || 0;
      const p2 = Number(cal.parcial2) || 0;
      const p3 = Number(cal.parcial3) || 0;

      // 2. Lógica de prioridad con redondeo
      if (pFinal > 0) {
        notaFinal = pFinal;
      } else if (ordinario > 0) {
        notaFinal = ordinario;
      } else {
        // Solo promediamos si hay al menos una calificación parcial registrada
        if (p1 > 0 || p2 > 0 || p3 > 0) {
          // Suma simple
          const promedioParciales = (p1 + p2 + p3) / 3;
          // Redondeamos la materia a 1 decimal (ej. 8.666 -> 8.7) para que sume limpio
          notaFinal = Math.round(promedioParciales * 10) / 10;
        }
      }

      // 3. Acumular si hay nota
      if (notaFinal > 0) {
        sumaPromedios += notaFinal;
        materiasContadas++;
      }
    });

    // 4. Cálculo final del promedio general
    if (materiasContadas > 0) {
      const promedioBruto = sumaPromedios / materiasContadas;
      // Redondeamos el resultado final también a 1 decimal
      this.promedioGeneral = Math.round(promedioBruto * 10) / 10;
    } else {
      this.promedioGeneral = 0.0;
    }
  }

  regresar() {
    this.router.navigate(['/home']);
  }

  cambiarPassword() {
    this.router.navigate(['/cambiar-password']);
  }

  descargarHistorial() {
    console.log("Descargar Historial");
  }


  descargarConstancia() {
    console.log("Descargar Constancia");
  }
}
