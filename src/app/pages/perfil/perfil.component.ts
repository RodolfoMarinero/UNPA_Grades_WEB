import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AlumnoData } from '../../interfaces/alumno';
import { CodigoBarrasComponent } from '../../components/codigo-barras/codigo-barras';

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


  alumno: AlumnoData | null = null;
  promedioGeneral: number = 0.0;
  descargando: boolean = false;

  ngOnInit() {
    this.alumno = this.authService.alumnoActual;

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
      const cal = m.calificaciones;
      let notaFinal = 0;

      const pFinal = Number(cal.pfinal) || 0;
      const ordinario = Number(cal.ordinario) || 0;
      const p1 = Number(cal.parcial1) || 0;
      const p2 = Number(cal.parcial2) || 0;
      const p3 = Number(cal.parcial3) || 0;

      if (pFinal > 0) {
        notaFinal = pFinal;
      } else if (ordinario > 0) {
        notaFinal = ordinario;
      } else {
        if (p1 > 0 || p2 > 0 || p3 > 0) {
          const promedioParciales = (p1 + p2 + p3) / 3;
          notaFinal = Math.round(promedioParciales * 10) / 10;
        }
      }

      if (notaFinal > 0) {
        sumaPromedios += notaFinal;
        materiasContadas++;
      }
    });

    if (materiasContadas > 0) {
      const promedioBruto = sumaPromedios / materiasContadas;
      this.promedioGeneral = Math.round(promedioBruto * 10) / 10;
    } else {
      this.promedioGeneral = 0.0;
    }
  }

  // --- ACCIONES DE BOTONES ---
  cambiarPassword() {
    this.router.navigate(['/cambiar-password']);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('matricula');
    this.router.navigate(['/login']);
  }

  // --- NAVEGACIÓN CABECERA UNIVERSAL ---
  irAHome() { this.router.navigate(['/home']); }
  irANotificaciones() { this.router.navigate(['/notificaciones']); }
  irACalendarioExamenes() { this.router.navigate(['/calendario']); }
  irAlPerfil() { this.router.navigate(['/perfil']); }

  descargarHistorial() {
    if (!this.alumno) return;

    this.descargando = true; // Mostramos un loader (puedes enlazarlo en tu HTML)
    const matricula = this.alumno.matricula;

    this.authService.descargarHistorial(matricula).subscribe({
      next: (blob: Blob) => {
        // 1. Creamos un objeto URL temporal en el navegador con el archivo
        const url = window.URL.createObjectURL(blob);

        // 2. Creamos un enlace <a> invisible
        const a = document.createElement('a');
        a.href = url;
        a.download = `Historial_${matricula}.pdf`; // Nombre del archivo a guardar

        // 3. Simulamos el clic y luego limpiamos la memoria
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.descargando = false;
      },
      error: (err) => {
        console.error('Error descargando historial:', err);
        alert('Hubo un error al generar el historial. Intente más tarde.');
        this.descargando = false;
      }
    });
  }

  descargarConstancia() {
    if (!this.alumno) return;

    this.descargando = true;
    const matricula = this.alumno.matricula;

    this.authService.descargarConstancia(matricula).subscribe({
      next: (blob: Blob) => {
        // Misma lógica de guardado
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Constancia_${matricula}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.descargando = false;
      },
      error: (err) => {
        console.error('Error descargando constancia:', err);
        alert('Hubo un error al generar la constancia. Intente más tarde.');
        this.descargando = false;
      }
    });
  }
}
