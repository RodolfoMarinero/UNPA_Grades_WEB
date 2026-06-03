import {Component, OnInit, inject, ChangeDetectorRef, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Aviso } from '../../interfaces/aviso';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css' // O .scss
})
export class NotificacionesComponent implements OnInit {

  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  avisos: Aviso[] = [];
  cargando: boolean = true;
  mensajeError: string = '';
  mensajeExito: string = '';
  matricula: string = '';
  menuAbiertoKey: string | null = null;

  ngOnInit() {
    console.log('🏁 Componente Notificaciones INICIADO');
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.cargando = true;
    this.matricula = localStorage.getItem('matricula') || this.authService.alumnoActual?.matricula || '';
    if (!this.matricula) {
      this.cargando = false;
      this.mensajeError = 'No se encontró la matrícula del alumno';
      this.cdr.detectChanges();
      return;
    }

    this.authService.getAvisosNoLeidos(this.matricula).subscribe({
      next: (data: any) => {
        this.avisos = data.map((item: any) => ({
          ...item,
          titulo: `Aviso Escolar`,
          aviso: item.aviso,
          remitente: 'Servicios Escolares',
          leido: false
        }));

        this.avisos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.cargando = false;
        this.cdr.detectChanges(); // 3. ¡FUERZA LA ACTUALIZACIÓN VISUAL AQUÍ!
      },
      error: (err) => {
        console.error('Error:', err);
        this.cargando = false;
        this.mensajeError = 'Error al cargar datos';
        this.cdr.detectChanges(); // 3. AQUÍ TAMBIÉN
      }
    });
  }

  marcarComoLeido(aviso: Aviso) {
    if (!this.matricula) return;
    this.menuAbiertoKey = null;

    this.authService.marcarAvisoComoLeido(this.matricula, {
      idAvi: aviso.id,
      cicloId: aviso.cicloId,
      periodoId: aviso.periodoId
    }).subscribe({
      next: () => {
        this.avisos = this.avisos.filter(a =>
          !(a.id === aviso.id && a.cicloId === aviso.cicloId && a.periodoId === aviso.periodoId)
        );
        this.mensajeExito = 'Aviso marcado como leído';
        setTimeout(() => {
          this.mensajeExito = '';
          this.cdr.detectChanges();
        }, 1800);
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'No se pudo marcar el aviso como leído';
        this.cdr.detectChanges();
      }
    });
  }

  toggleMenu(event: Event, aviso: Aviso) {
    event.stopPropagation();
    const key = this.crearMenuKey(aviso);
    this.menuAbiertoKey = this.menuAbiertoKey === key ? null : key;
  }

  estaMenuAbierto(aviso: Aviso): boolean {
    return this.menuAbiertoKey === this.crearMenuKey(aviso);
  }

  onMarcarLeidoDesdeMenu(event: Event, aviso: Aviso) {
    event.stopPropagation();
    this.marcarComoLeido(aviso);
  }

  @HostListener('document:click')
  cerrarMenu() {
    this.menuAbiertoKey = null;
  }

  private crearMenuKey(aviso: Aviso): string {
    return `${aviso.id}-${aviso.cicloId}-${aviso.periodoId}`;
  }

  regresar() {
    this.router.navigate(['/home']);
  }
  irAHome() { this.router.navigate(['/home']); }
  irANotificaciones() { this.router.navigate(['/notificaciones']); }
  irACalendarioExamenes() { this.router.navigate(['/calendario']); }
  irAlPerfil() { this.router.navigate(['/perfil']); }
}
