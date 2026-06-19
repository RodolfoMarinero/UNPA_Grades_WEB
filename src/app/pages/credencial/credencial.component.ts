import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AlumnoData } from '../../interfaces/alumno';
import { CodigoBarrasComponent } from '../../components/codigo-barras/codigo-barras';
import {
  centerCropToCredentialAspect,
  dataUrlToCredentialFile,
  fileToCredentialFile
} from '../../utils/credential-photo';

@Component({
  selector: 'app-credencial',
  standalone: true,
  imports: [CommonModule, CodigoBarrasComponent],
  templateUrl: './credencial.component.html',
  styleUrl: './credencial.component.css'
})
export class CredencialComponent implements OnInit, OnDestroy {

  private authService = inject(Auth);
  private router = inject(Router);

  @ViewChild('photoMenuRoot') photoMenuRoot?: ElementRef<HTMLElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;

  alumno: AlumnoData | null = null;
  selectedFile: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto = false;
  photoMenuOpen = false;
  cameraModalOpen = false;
  cameraError = '';
  private cameraStream: MediaStream | null = null;
  cameraCapturedPreview: string | null = null;

  ngOnInit() {
    this.alumno = this.authService.alumnoActual;

    if (!this.alumno) {
      this.router.navigate(['/home']);
    }
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

    try {
      const canvas = centerCropToCredentialAspect(video, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      if (!dataUrl.startsWith('data:image/')) {
        return;
      }

      this.clearCapturedPhoto();
      this.cameraCapturedPreview = dataUrl;
      this.stopCameraStream();
    } catch (error) {
      console.error('No se pudo capturar la foto:', error);
      this.cameraError = 'No se pudo procesar la foto capturada.';
    }
  }

  async retakeCameraPhoto(): Promise<void> {
    this.clearCapturedPhoto();
    await this.startCameraStream();
  }

  async confirmCapturedPhoto(): Promise<void> {
    if (!this.cameraCapturedPreview) {
      return;
    }

    try {
      this.selectedFile = await dataUrlToCredentialFile(
        this.cameraCapturedPreview,
        `foto-credencial-${Date.now()}.jpg`
      );
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = URL.createObjectURL(this.selectedFile);
      this.clearCapturedPhoto();
      this.resetFileInputs();
      this.cameraModalOpen = false;
    } catch (error) {
      console.error('No se pudo preparar la foto:', error);
      this.cameraError = 'No se pudo preparar la foto de credencial.';
    }
  }

  private clearCapturedPhoto(): void {
    this.cameraCapturedPreview = null;
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

  irAHome() { this.router.navigate(['/home']); }
  irANotificaciones() { this.router.navigate(['/notificaciones']); }
  irACalendarioExamenes() { this.router.navigate(['/calendario']); }
  irAlCorcho() { this.router.navigate(['/corcho']); }
  irAlPerfil() { this.router.navigate(['/perfil']); }
  irACredencial() { this.router.navigate(['/credencial']); }

  async onFileSelected(event: Event) {
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

    try {
      this.selectedFile = await fileToCredentialFile(file);
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = URL.createObjectURL(this.selectedFile);
      this.resetFileInputs();
    } catch (error) {
      console.error('No se pudo procesar la imagen:', error);
      alert('No se pudo procesar la imagen seleccionada.');
      this.selectedFile = null;
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = null;
      this.resetFileInputs();
    }
  }

  subirFotoCredencial() {
    if (!this.alumno || !this.selectedFile) return;

    this.subiendoFoto = true;
    this.authService.uploadFotoCredencial(this.alumno.matricula, this.selectedFile).subscribe({
      next: (resp) => {
        this.alumno = {
          ...this.alumno!,
          fotoCredencialUrl: resp.url
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
        console.error('Error subiendo foto de credencial:', err);
        alert('No se pudo guardar la foto de credencial. Intenta de nuevo.');
        this.subiendoFoto = false;
      }
    });
  }
}
