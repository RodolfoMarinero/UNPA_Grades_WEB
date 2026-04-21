import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
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
export class PerfilComponent implements OnInit, OnDestroy {

  private authService = inject(Auth);
  private router = inject(Router);

  @ViewChild('photoMenuRoot') photoMenuRoot?: ElementRef<HTMLElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;

  alumno: AlumnoData | null = null;
  promedioGeneral: number = 0.0;
  descargando: boolean = false;
  selectedFile: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto: boolean = false;
  photoMenuOpen = false;
  cameraModalOpen = false;
  cameraError = '';
  private cameraStream: MediaStream | null = null;
  cameraCapturedPreview: string | null = null;

  ngOnInit() {
    this.alumno = this.authService.alumnoActual;

    if (!this.alumno) {
      this.router.navigate(['/home']);
      return;
    }

    this.calcularPromedio();
  }

  ngOnDestroy(): void {
    this.stopCameraStream();
    this.clearCapturedPhoto();
    if (this.fotoPreview) {
      URL.revokeObjectURL(this.fotoPreview);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.photoMenuOpen) {
      return;
    }
    const root = this.photoMenuRoot?.nativeElement;
    if (root?.contains(event.target as Node)) {
      return;
    }
    this.photoMenuOpen = false;
  }

  togglePhotoMenu(): void {
    this.photoMenuOpen = !this.photoMenuOpen;
  }

  async openCameraPicker(): Promise<void> {
    this.photoMenuOpen = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.openCameraInputFallback();
      return;
    }

    this.cameraError = '';
    this.cameraModalOpen = true;
    this.clearCapturedPhoto();

    await this.startCameraStream();
  }

  private async startCameraStream(): Promise<void> {
    this.stopCameraStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      this.cameraStream = stream;
      setTimeout(() => {
        const video = this.cameraVideo?.nativeElement;
        if (!video || !this.cameraStream) return;
        video.srcObject = this.cameraStream;
        void video.play();
      });
    } catch (error) {
      console.error('No se pudo abrir la camara:', error);
      this.cameraError = 'No se pudo abrir la camara. Revisa permisos del navegador.';
      this.openCameraInputFallback();
      this.closeCameraModal();
    }
  }

  private openCameraInputFallback(): void {
    const input = this.cameraInput?.nativeElement;
    if (!input) return;

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      try {
        pickerInput.showPicker();
        return;
      } catch {
        // Fallback para navegadores que restringen showPicker().
      }
    }

    input.click();
  }

  closeCameraModal(): void {
    this.cameraModalOpen = false;
    this.stopCameraStream();
    this.clearCapturedPhoto();
  }

  private stopCameraStream(): void {
    if (!this.cameraStream) {
      return;
    }
    this.cameraStream.getTracks().forEach(track => track.stop());
    this.cameraStream = null;
  }

  captureFromCamera(): void {
    const video = this.cameraVideo?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Invertimos horizontalmente para que la foto final no quede en modo espejo.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (!dataUrl.startsWith('data:image/')) {
      return;
    }

    this.clearCapturedPhoto();
    this.cameraCapturedPreview = dataUrl;
    this.stopCameraStream();
  }

  async retakeCameraPhoto(): Promise<void> {
    this.clearCapturedPhoto();
    await this.startCameraStream();
  }

  confirmCapturedPhoto(): void {
    if (!this.cameraCapturedPreview) {
      return;
    }

    this.selectedFile = this.dataUrlToFile(this.cameraCapturedPreview, `foto-perfil-${Date.now()}.jpg`);
    if (this.fotoPreview) {
      URL.revokeObjectURL(this.fotoPreview);
    }
    this.fotoPreview = URL.createObjectURL(this.selectedFile);
    this.clearCapturedPhoto();
    this.resetFileInputs();
    this.cameraModalOpen = false;
  }

  private clearCapturedPhoto(): void {
    this.cameraCapturedPreview = null;
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const [meta, payload] = dataUrl.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
  }

  openGalleryPicker(): void {
    this.photoMenuOpen = false;
    this.galleryInput?.nativeElement.click();
  }

  private resetFileInputs(): void {
    if (this.cameraInput?.nativeElement) {
      this.cameraInput.nativeElement.value = '';
    }
    if (this.galleryInput?.nativeElement) {
      this.galleryInput.nativeElement.value = '';
    }
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = null;
      this.resetFileInputs();
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen valido.');
      this.selectedFile = null;
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = null;
      this.resetFileInputs();
      return;
    }

    this.selectedFile = file;
    if (this.fotoPreview) {
      URL.revokeObjectURL(this.fotoPreview);
    }
    this.fotoPreview = URL.createObjectURL(file);
    this.resetFileInputs();
  }

  subirFotoPerfil() {
    if (!this.alumno || !this.selectedFile) return;

    this.subiendoFoto = true;
    this.authService.uploadFotoPerfil(this.alumno.matricula, this.selectedFile).subscribe({
      next: (resp) => {
        this.alumno = {
          ...this.alumno!,
          fotoPerfilUrl: resp.url
        };
        this.authService.alumnoActual = this.alumno;
        this.selectedFile = null;
        if (this.fotoPreview) {
          URL.revokeObjectURL(this.fotoPreview);
        }
        this.fotoPreview = null;
        this.subiendoFoto = false;
      },
      error: (err) => {
        console.error('Error subiendo foto de perfil:', err);
        alert('No se pudo subir la foto. Intenta de nuevo.');
        this.subiendoFoto = false;
      }
    });
  }
}
