import { Component, inject, OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AlumnoData, Materia } from '../../interfaces/alumno';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private router = inject(Router);
  private authService = inject(Auth);
  private cdr = inject(ChangeDetectorRef);

  // Variables del Menú (Las dejamos por si en el futuro regresas a la versión móvil)
  menuVisible: boolean = false;
  toggleMenu() { this.menuVisible = !this.menuVisible; }
  cerrarMenu() { this.menuVisible = false; }

  // Control del Selector de Ciclos (Dropdown)
  mostrarListaCiclos: boolean = false;
  toggleListaCiclos() {
    this.mostrarListaCiclos = !this.mostrarListaCiclos;
  }
  seleccionarCiclo(indice: number) {
    this.indiceCicloActual = indice;
    this.actualizarTabla();
    this.mostrarListaCiclos = false;
  }

  // Variables de Datos
  alumno: AlumnoData | null = null;
  materiasFiltradas: any[] = []; // Usamos any[] o Materia[] (si actualizaste la interfaz) para soportar isExpanded
  materiasConExtra: any[] = [];

  // Control de ciclos escolares
  ciclosDisponibles: string[] = [];
  indiceCicloActual: number = 0;
  periodoActual: string = 'Cargando...';

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const matricula = localStorage.getItem('matricula');

    if (!matricula) {
      this.logout();
      return;
    }

    this.authService.getAlumnoCompleto(matricula).subscribe({
      next: (data) => {
        this.alumno = data;

        // Extraer y ordenar ciclos
        const ciclosUnicos = new Set(data.materias.map(m => m.ciclo));
        this.ciclosDisponibles = Array.from(ciclosUnicos).sort().reverse();

        // Seleccionar el más reciente
        if (this.ciclosDisponibles.length > 0) {
          this.indiceCicloActual = 0;
          this.actualizarTabla();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        alert('Sesión expirada o error de red');
        this.logout();
      }
    });
  }

  cambiarCiclo(direccion: number) {
    const nuevoIndice = this.indiceCicloActual + direccion;
    if (nuevoIndice >= 0 && nuevoIndice < this.ciclosDisponibles.length) {
      this.indiceCicloActual = nuevoIndice;
      this.actualizarTabla();
    }
  }

  actualizarTabla() {
    this.periodoActual = this.ciclosDisponibles[this.indiceCicloActual];

    if (this.alumno) {
      // 🔥 MAGIA AQUÍ: Filtramos y les agregamos isExpanded: false por defecto
      // Así, al cambiar de semestre, todas las tarjetas aparecen cerradas ordenadamente.
      this.materiasFiltradas = this.alumno.materias
        .filter(m => m.ciclo === this.periodoActual)
        .map(m => ({ ...m, isExpanded: false }));

      // Filtro de Extras
      this.materiasConExtra = this.materiasFiltradas.filter(m =>
        m.calificaciones.extra1 !== null ||
        m.calificaciones.extra2 !== null ||
        m.calificaciones.especial !== null
      );
    }
  }

  getPromedio(cal: any): number {
    const p1 = cal.parcial1 || 0;
    const p2 = cal.parcial2 || 0;
    const p3 = cal.parcial3 || 0;
    return (p1 + p2 + p3) / 3;
  }

  irAlPerfil() { this.router.navigate(['/perfil']); }
  irANotificaciones() { this.router.navigate(['/notificaciones']); }
  irACalendarioExamenes() { this.router.navigate(['/calendario']); }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('matricula');
    this.router.navigate(['/login']);
  }

  descargarPDF() {
    if (!this.alumno) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const margenIzquierdo = 14;
    let posicionY = 20;

    // Encabezados
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Calificaciones', margenIzquierdo, posicionY);
    posicionY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${this.alumno.nombre} ${this.alumno.apPaterno} ${this.alumno.apMaterno}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Matrícula: ${this.alumno.matricula}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Carrera: ${this.alumno.nombreCarrera}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Periodo: ${this.periodoActual}`, margenIzquierdo, posicionY);
    posicionY += 10;

    // Tabla de Ordinarios
    const cuerpoTabla = this.materiasFiltradas.map(m => [
      m.materia,
      this.formatearNota(m.calificaciones.parcial1),
      this.formatearNota(m.calificaciones.parcial2),
      this.formatearNota(m.calificaciones.parcial3),
      this.getPromedio(m.calificaciones).toFixed(1),
      this.formatearNota(m.calificaciones.ordinario),
      this.formatearNota(m.calificaciones.pfinal)
    ]);

    autoTable(doc, {
      startY: posicionY,
      head: [['Materia', '1er', '2o', '3er', 'Prom', 'Ord', 'Final']],
      body: cuerpoTabla,
      theme: 'grid',
      headStyles: { fillColor: [15, 76, 58], textColor: 255 }, // Ajustado al verde oscuro institucional #0F4C3A
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const valor = parseFloat(data.cell.raw as string);
          if (valor < 6.0) {
            data.cell.styles.textColor = [211, 47, 47]; // Rojo institucional (#D32F2F)
          }
        }
      }
    });

    // @ts-ignore
    posicionY = doc.lastAutoTable.finalY + 15;

    // Tabla de Extras
    if (this.materiasConExtra.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Calificaciones Extraordinarias', margenIzquierdo, posicionY);
      posicionY += 5;

      const cuerpoExtra = this.materiasConExtra.map(m => [
        m.materia,
        this.formatearNota(m.calificaciones.extra1),
        this.formatearNota(m.calificaciones.extra2),
        this.formatearNota(m.calificaciones.especial)
      ]);

      autoTable(doc, {
        startY: posicionY,
        head: [['Materia', 'Extra 1', 'Extra 2', 'Especial']],
        body: cuerpoExtra,
        theme: 'striped',
        headStyles: { fillColor: [211, 47, 47] }, // Rojo para extras
        columnStyles: { 0: { cellWidth: 90 } }
      });
    }

    doc.save(`calificaciones_${this.alumno.matricula}.pdf`);
  }

  formatearNota(valor: number | null): string {
    return (valor !== null && valor !== undefined) ? valor.toFixed(1) : '-';
  }

  irAHome() { this.router.navigate(['/home']); }
}
