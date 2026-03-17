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


  menuVisible: boolean = false;

  // Función para abrir/cerrar
  toggleMenu() {
    this.menuVisible = !this.menuVisible;
  }

  // Función para cerrar el menú cuando se hace clic fuera (opcional pero recomendada)
  cerrarMenu() {
    this.menuVisible = false;
  }

  // Variable nueva para mostrar/ocultar la lista de ciclos
  mostrarListaCiclos: boolean = false;

  // Función para alternar la visibilidad de la lista
  toggleListaCiclos() {
    this.mostrarListaCiclos = !this.mostrarListaCiclos;
  }

  // Función para seleccionar un ciclo específico de la lista
  seleccionarCiclo(indice: number) {
    this.indiceCicloActual = indice;
    this.actualizarTabla();
    this.mostrarListaCiclos = false; // Cerrar la lista al seleccionar
  }

  // Variables para la vista
  alumno: AlumnoData | null = null; // Datos completos
  materiasFiltradas: Materia[] = []; // Las que se ven en la tabla

  materiasConExtra: Materia[] = [];

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
      this.logout(); // Si no hay matrícula, sacar al usuario
      return;
    }

    this.authService.getAlumnoCompleto(matricula).subscribe({
      next: (data) => {
        this.alumno = data;
        console.log('🔥 ¡DATOS RECIBIDOS DEL SERVIDOR! 🔥');
        console.log(data);

        const listaMaterias = data.materias || [];
        // 1. Extraer todos los ciclos únicos (2021-A, 2022-B, etc.)
        const ciclosUnicos = new Set(data.materias.map(m => m.ciclo));
        // Convertir a array y ordenarlos (los más nuevos primero)
        this.ciclosDisponibles = Array.from(ciclosUnicos).sort().reverse();

        // 2. Seleccionar el más reciente por defecto (el primero de la lista)
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

  // Función para cambiar periodo con las flechas
  cambiarCiclo(direccion: number) {
    const nuevoIndice = this.indiceCicloActual + direccion;

    // Validar que no se salga del arreglo
    if (nuevoIndice >= 0 && nuevoIndice < this.ciclosDisponibles.length) {
      this.indiceCicloActual = nuevoIndice;
      this.actualizarTabla();
    }
  }

  // Filtra las materias según el ciclo seleccionado
  actualizarTabla() {
    this.periodoActual = this.ciclosDisponibles[this.indiceCicloActual];

    if (this.alumno) {
      // Filtro normal (todas las materias del ciclo)
      this.materiasFiltradas = this.alumno.materias.filter(
        m => m.ciclo === this.periodoActual
      );

      // Filtro de Extras: Solo las que tengan algún valor en extra1, extra2 o especial
      this.materiasConExtra = this.materiasFiltradas.filter(m =>
        m.calificaciones.extra1 !== null ||
        m.calificaciones.extra2 !== null ||
        m.calificaciones.especial !== null
      );
    }
  }

  getPromedio(cal: any): number {
    const p1 = cal.parcial1 || 0; // Si es null, vale 0
    const p2 = cal.parcial2 || 0;
    const p3 = cal.parcial3 || 0;

    return (p1 + p2 + p3) / 3;
  }

  irAlPerfil() {
    this.router.navigate(['/perfil']);
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('matricula');
    this.router.navigate(['/login']);
  }

  descargarPDF() {
    if (!this.alumno) return;

    // 1. Crear documento (Orientación vertical 'p', unidad 'mm', formato 'a4')
    const doc = new jsPDF('p', 'mm', 'a4');
    const margenIzquierdo = 14;
    let posicionY = 20; // Equivalente a tu variable 'y' en Android

    // --------------------------------------------------
    // 2. ENCABEZADOS (Igual que en tu Android Canvas)
    // --------------------------------------------------

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Calificaciones', margenIzquierdo, posicionY);
    posicionY += 10;

    // Datos del Alumno
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${this.alumno.nombre} ${this.alumno.apPaterno} ${this.alumno.apMaterno}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Matrícula: ${this.alumno.matricula}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Carrera: ${this.alumno.nombreCarrera}`, margenIzquierdo, posicionY);
    posicionY += 6;
    doc.text(`Periodo: ${this.periodoActual}`, margenIzquierdo, posicionY); // Agregamos el ciclo escolar
    posicionY += 10; // Espacio antes de la tabla

    // --------------------------------------------------
    // 3. TABLA DE CALIFICACIONES (Reemplaza tu 'for' manual)
    // --------------------------------------------------

    // Preparamos los datos para la tabla (Array de Arrays)
    const cuerpoTabla = this.materiasFiltradas.map(m => [
      m.materia,
      this.formatearNota(m.calificaciones.parcial1),
      this.formatearNota(m.calificaciones.parcial2),
      this.formatearNota(m.calificaciones.parcial3),
      this.getPromedio(m.calificaciones).toFixed(1), // Usamos tu función de promedio
      this.formatearNota(m.calificaciones.ordinario),
      this.formatearNota(m.calificaciones.pfinal)
    ]);

    autoTable(doc, {
      startY: posicionY,
      head: [['Materia', '1er', '2o', '3er', 'Prom', 'Ord', 'Final']],
      body: cuerpoTabla,
      theme: 'grid', // Estilo de tabla limpio
      headStyles: { fillColor: [22, 160, 133], textColor: 255 }, // Color verde UNPA aproximado
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 } // Ancho mayor para la columna Materia (wrap automático)
      },
      // Lógica para pintar rojos los reprobados (Opcional, similar a tu Android)
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const valor = parseFloat(data.cell.raw as string);
          if (valor < 6.0) {
            data.cell.styles.textColor = [200, 0, 0]; // Rojo
          }
        }
      }
    });

    // Actualizamos la posición Y al final de la tabla automática
    // @ts-ignore (Para evitar error de tipado en versiones viejas de TS)
    posicionY = doc.lastAutoTable.finalY + 15;

    // --------------------------------------------------
    // 4. TABLA DE EXTRAORDINARIOS (Si existen)
    // --------------------------------------------------
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
        headStyles: { fillColor: [192, 57, 43] }, // Rojo para extras
        columnStyles: { 0: { cellWidth: 90 } }
      });
    }

    // --------------------------------------------------
    // 5. GUARDAR ARCHIVO
    // --------------------------------------------------
    const nombreArchivo = `calificaciones_${this.alumno.matricula}.pdf`;
    doc.save(nombreArchivo);
  }

  // Pequeña ayuda para formatear nulos a guiones (como en tu HTML)
  formatearNota(valor: number | null): string {
    return (valor !== null && valor !== undefined) ? valor.toFixed(1) : '-';
  }

  irANotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  irACalendarioExamenes() {
    this.router.navigate(['/calendario']);
  }
}
