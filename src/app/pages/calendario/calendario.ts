import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

// Interfaz para tipar los eventos (Igual a EventoExamen en Android)
interface EventoExamen {
  fechaRaw: string;   // Ej: "2026-04-06"
  dia: number;        // Ej: 6
  mesNum: number;     // Ej: 3 (Abril, en base 0)
  mesStr: string;     // Ej: "Abril"
  materia: string;    // Ej: "Optativa I"
  tipoExamen: string; // Ej: "1er Parcial"
}

// Interfaz para construir los meses visuales
interface MesVisual {
  nombre: string;
  anio: number;
  mesIdx: number;
  espacios: number[]; // Días en blanco al inicio del mes
  dias: { num: number, tipo: string }[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css']
})
export class CalendarioComponent implements OnInit {

  private router = inject(Router);
  private authService = inject(Auth);

  periodo = 'Cargando...';
  eventos: EventoExamen[] = [];

  // Calendario visual
  diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  meses: MesVisual[] = [];
  nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Para el Modal (Popup)
  mostrarModal = false;
  tituloModal = '';
  eventosModal: EventoExamen[] = [];

  ngOnInit() {
    this.procesarFechasDelApi();
  }

  procesarFechasDelApi() {
    const alumno = this.authService.alumnoActual;

    // Si no hay alumno o no hay materias, salimos
    if (!alumno || !alumno.materias || alumno.materias.length === 0) {
      this.periodo = 'No hay materias registradas';
      return;
    }

    // Obtener el ciclo más reciente (Igual que en Android)
    const ciclos = alumno.materias.map(m => m.ciclo).filter(c => c);
    const cicloActual = ciclos.length > 0 ? ciclos.sort().reverse()[0] : 'Sin Ciclo';
    this.periodo = cicloActual;

    this.eventos = [];

    // Recorrer las materias del ciclo actual y extraer exámenes
    alumno.materias.filter(m => m.ciclo === cicloActual).forEach(materia => {

      // 🔥 EL CAMBIO ESTÁ AQUÍ 🔥
      // Buscamos el objeto de las fechas (revisa si en tu interfaz se llama 'calendario' o 'calendarioExamenes')
      const fechas = materia.calendarioExamenes; // O puede ser materia.calendario

      if (fechas) {
        // Usamos las variables que sí guardan las fechas (p1, p2, f, etc.)
        this.addEvento(fechas.p1, materia.materia, "1er Parcial");
        this.addEvento(fechas.p2, materia.materia, "2do Parcial");
        this.addEvento(fechas.p3, materia.materia, "3er Parcial");
        this.addEvento(fechas.f, materia.materia, "Ordinario");
        this.addEvento(fechas.e1, materia.materia, "Extraordinario 1");
        this.addEvento(fechas.e2, materia.materia, "Extraordinario 2");
        this.addEvento(fechas.esp, materia.materia, "Especial");
      }
    });

    // Ordenar cronológicamente (Igual que it.fechaRaw en Android)
    this.eventos.sort((a, b) => new Date(a.fechaRaw).getTime() - new Date(b.fechaRaw).getTime());

    // Construir el calendario visual basado en los eventos encontrados
    this.construirCalendarioVisual();
  }

  // Equivalente a tu addEvento() de Android
  private addEvento(fechaRaw: string | null | undefined, nombreMateria: string, tipoExamen: string) {
    if (fechaRaw) { // Si la fecha existe y no es null
      const fechaObj = new Date(fechaRaw);

      // Compensar zona horaria si la fecha viene como "2026-04-06" puro sin T00:00:00
      fechaObj.setMinutes(fechaObj.getMinutes() + fechaObj.getTimezoneOffset());

      this.eventos.push({
        fechaRaw: fechaRaw,
        dia: fechaObj.getDate(),
        mesNum: fechaObj.getMonth(), // 0-11
        mesStr: this.nombresMeses[fechaObj.getMonth()].substring(0, 3).toUpperCase(), // "ABR"
        materia: nombreMateria,
        tipoExamen: tipoExamen
      });
    }
  }

  // --- LÓGICA DE CONSTRUCCIÓN VISUAL DEL CALENDARIO ---
  construirCalendarioVisual() {
    this.meses = [];
    if (this.eventos.length === 0) return;

    // 1. Encontrar el rango de meses (Desde el primer examen hasta el último)
    const primerMes = this.eventos[0].mesNum;
    const primerAnio = new Date(this.eventos[0].fechaRaw).getFullYear();

    const ultimoMes = this.eventos[this.eventos.length - 1].mesNum;
    const ultimoAnio = new Date(this.eventos[this.eventos.length - 1].fechaRaw).getFullYear();

    let anioActual = primerAnio;
    let mesActual = primerMes;

    // 2. Iterar y crear las tarjetas de los meses
    while (anioActual < ultimoAnio || (anioActual === ultimoAnio && mesActual <= ultimoMes)) {

      // Calcular días en blanco al inicio del mes (0 = Dom, 1 = Lun...)
      const primerDiaDelMes = new Date(anioActual, mesActual, 1).getDay();
      const espacios = Array(primerDiaDelMes).fill(0);

      // Calcular total de días que tiene ese mes
      const diasEnElMes = new Date(anioActual, mesActual + 1, 0).getDate();

      // Generar los días y marcar los que tienen evento
      let diasRenderizados = [];
      for (let i = 1; i <= diasEnElMes; i++) {
        // ¿Hay eventos este día?
        const eventosEsteDia = this.eventos.filter(e => e.dia === i && e.mesNum === mesActual && new Date(e.fechaRaw).getFullYear() === anioActual);

        diasRenderizados.push({
          num: i,
          tipo: eventosEsteDia.length > 0 ? 'morado' : 'normal',
          fechaCompleta: `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` // Para el clic
        });
      }

      this.meses.push({
        nombre: this.nombresMeses[mesActual].toUpperCase(),
        anio: anioActual,
        mesIdx: mesActual,
        espacios: espacios,
        dias: diasRenderizados
      });

      // Avanzar al siguiente mes
      mesActual++;
      if (mesActual > 11) {
        mesActual = 0;
        anioActual++;
      }
    }
  }

  // Equivalente a onDayClick() de Android
  onDayClick(dia: any) {
    if (dia.tipo === 'morado') {
      // Filtrar los eventos de esa fecha exacta
      this.eventosModal = this.eventos.filter(e => e.fechaRaw === dia.fechaCompleta);

      if (this.eventosModal.length > 0) {
        this.tituloModal = `📅 Exámenes del ${this.eventosModal[0].dia} de ${this.nombresMeses[this.eventosModal[0].mesNum]}`;
        this.mostrarModal = true;
      }
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  // Navegación Universal
  irAHome() { this.router.navigate(['/home']); }
  irANotificaciones() { this.router.navigate(['/notificaciones']); }
  irACalendarioExamenes() { this.router.navigate(['/calendario']); }
  irAlPerfil() { this.router.navigate(['/perfil']); }
}
