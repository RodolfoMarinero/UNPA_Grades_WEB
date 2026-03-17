import {Component, OnInit, inject, ChangeDetectorRef} from '@angular/core';
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

  ngOnInit() {
    console.log('🏁 Componente Notificaciones INICIADO');
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.cargando = true;
    const matricula = this.authService.alumnoActual?.matricula || '00000000';

    this.authService.getAvisos().subscribe({
      next: (data: any) => {
        // ... (Tu lógica de mapeo que ya funciona bien) ...

        // ASEGURATE DE QUE EL MAPEO USE 'item.aviso' (el campo de tu BD)
        this.avisos = data.map((item: any) => ({
          ...item,
          titulo: `Aviso Escolar`, // O lo que prefieras
          aviso: item.aviso,       // IMPORTANTE: Tu Android dice que se llama 'aviso'
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

  regresar() {
    this.router.navigate(['/home']);
  }
}
