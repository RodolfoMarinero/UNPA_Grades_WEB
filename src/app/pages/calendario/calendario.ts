import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; // Asumiendo que aquí harás la petición
import { Calendario } from '../../interfaces/calendario';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css']
})
export class CalendarioComponent implements OnInit {

  private router = inject(Router);

  // Datos simulados (Mock) basados en tu imagen para probar el diseño
  examenes: Calendario[] = [
    { materia: 'Optativa II', p1: '2025-10-29', p2: '2025-12-03', p3: '2026-01-21', f: '2026-01-30', e1: '2026-02-16', e2: '2026-03-02', esp: '2026-03-12' },
    { materia: 'Optativa I', p1: '2025-10-30', p2: '2025-12-04', p3: '2026-01-22', f: '2026-02-03', e1: '2026-02-17', e2: '2026-03-03', esp: '2026-03-12' },
    { materia: 'Investigación de Operaciones', p1: '2025-10-27', p2: '2025-12-01', p3: '2026-01-19', f: '2026-02-06', e1: '2026-02-13', e2: '2026-03-06', esp: '2026-03-12' },
    { materia: 'Administración de Redes', p1: '2025-10-28', p2: '2025-12-02', p3: '2026-01-20', f: '2026-02-05', e1: '2026-02-18', e2: '2026-03-04', esp: '2026-03-12' },
    { materia: 'Desarrollo de Videojuegos', p1: '2025-10-31', p2: '2025-12-05', p3: '2026-01-23', f: '2026-02-02', e1: '2026-02-19', e2: '2026-03-05', esp: '2026-03-12' },
  ];

  ngOnInit() {
    // AQUÍ LLAMARÍAS A TU SERVICIO MÁS ADELANTE
    // this.authService.getCalendario(...).subscribe(data => this.examenes = data);
  }

  regresar() {
    this.router.navigate(['/home']);
  }
}
