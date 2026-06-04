import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { Auth } from '../../services/auth';

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string | HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId: number) => void;
    };
  }
}

@Component({
  selector: 'app-reportar-acceso-no-autorizado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportar-acceso-no-autorizado.html',
  styleUrl: './reportar-acceso-no-autorizado.css'
})
export class ReportarAccesoNoAutorizadoComponent implements AfterViewInit {
  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private readonly recaptchaSiteKey = '6LeKif8sAAAAACipSUBmkjEq47WB1lAK3bef-5e7';
  private readonly recaptchaScriptId = 'google-recaptcha-script';
  private readonly requestTimeoutMs = 60000;

  matricula = '';
  detalle = '';
  codigo = '';
  captchaToken = '';
  codigoEnviado = false;
  reporteEnviado = false;
  enviandoCodigo = false;
  enviandoReporte = false;
  mensajeError = '';
  mensajeExito = '';
  mensajeBloqueo = '';
  recaptchaWidgetId: number | null = null;
  recaptchaListo = false;
  mostrarSeccionCodigo = false;

  ngAfterViewInit(): void {
    this.inicializarRecaptcha();
  }

  solicitarCodigo() {
    this.resetMensajes();
    if (!this.matricula.trim()) {
      this.mensajeError = 'Ingresa tu matricula';
      return;
    }
    if (!this.captchaToken) {
      this.mensajeError = 'Confirma que no eres un robot';
      return;
    }

    this.enviandoCodigo = true;

    this.authService.solicitarCodigoReporteAcceso(this.matricula.trim(), this.captchaToken).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => {
        this.enviandoCodigo = false;
        this.resetearRecaptcha();
        this.actualizarVista();
      })
    ).subscribe({
      next: (res) => {
        this.activarPasoIngresoCodigo(res.message || 'Codigo enviado a tu correo registrado');
      },
      error: (err) => {
        const esTimeout = err?.name === 'TimeoutError';
        const esErrorConexion = err?.status === 0;
        const mensajeServidor = err?.error?.message as string | undefined;

        // El correo puede haberse enviado aunque la respuesta HTTP falle o tarde.
        if (esTimeout || esErrorConexion) {
          this.activarPasoIngresoCodigo(
            'Revisa tu correo. Si ya recibiste el codigo, ingresalo abajo.'
          );
          return;
        }

        if (mensajeServidor?.includes('Ya se envio un codigo')) {
          this.activarPasoIngresoCodigo('Ya se envio un codigo a tu correo. Ingresalo abajo.');
          return;
        }

        this.mensajeError = mensajeServidor || 'No se pudo enviar el codigo de verificacion';
        this.actualizarVista();
      }
    });
  }

  enviarReporte() {
    this.resetMensajes();
    if (!this.matricula.trim() || !this.codigo.trim()) {
      this.mensajeError = 'Ingresa matricula y codigo de verificacion';
      return;
    }
    if (this.codigo.trim().length !== 6) {
      this.mensajeError = 'El codigo debe tener 6 digitos';
      return;
    }

    this.enviandoReporte = true;

    this.authService.validarCodigoReporteAcceso(
      this.matricula.trim(),
      this.codigo.trim(),
      this.detalle.trim()
    ).pipe(
      finalize(() => {
        this.enviandoReporte = false;
        this.actualizarVista();
      })
    ).subscribe({
      next: (res) => {
        this.reporteEnviado = true;
        this.mostrarSeccionCodigo = false;
        this.mensajeExito = res?.message || 'Reporte enviado correctamente';
        this.mensajeBloqueo =
          '';
        this.codigo = '';
        this.actualizarVista();
      },
      error: (err) => {
        this.mensajeError = err?.error?.message || 'No se pudo validar el codigo';
        this.actualizarVista();
      }
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  private activarPasoIngresoCodigo(mensaje: string) {
    this.codigoEnviado = true;
    this.mostrarSeccionCodigo = true;
    this.mensajeError = '';
    this.mensajeExito = mensaje;
    this.actualizarVista();
  }

  private actualizarVista() {
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  private resetMensajes() {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.mensajeBloqueo = '';
  }

  private inicializarRecaptcha() {
    this.cargarScriptRecaptcha()
      .then(() => {
        this.renderizarRecaptcha();
      })
      .catch(() => {
        this.mensajeError = 'No se pudo cargar reCAPTCHA de Google. Verifica internet, extensiones bloqueadoras y dominio autorizado.';
        this.recaptchaListo = false;
      });
  }

  private cargarScriptRecaptcha(): Promise<void> {
    if (window.grecaptcha) {
      return Promise.resolve();
    }

    const existente = document.getElementById(this.recaptchaScriptId) as HTMLScriptElement | null;
    if (existente) {
      return this.esperarGrecaptcha(15000);
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = this.recaptchaScriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    }).then(() => this.esperarGrecaptcha(15000));
  }

  private esperarGrecaptcha(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const inicio = Date.now();
      const timer = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - inicio > timeoutMs) {
          clearInterval(timer);
          reject();
        }
      }, 150);
    });
  }

  private renderizarRecaptcha() {
    if (!window.grecaptcha) {
      this.mensajeError = 'reCAPTCHA no esta disponible en este momento.';
      this.recaptchaListo = false;
      return;
    }

    try {
      this.recaptchaWidgetId = window.grecaptcha.render('recaptcha-container', {
        sitekey: this.recaptchaSiteKey,
        callback: (token: string) => {
          this.ngZone.run(() => {
            this.captchaToken = token;
            this.cdr.markForCheck();
          });
        },
        'expired-callback': () => {
          this.ngZone.run(() => {
            this.captchaToken = '';
            this.cdr.markForCheck();
          });
        },
        'error-callback': () => {
          this.ngZone.run(() => {
            this.captchaToken = '';
            this.cdr.markForCheck();
          });
        }
      });
      this.recaptchaListo = true;
      this.cdr.markForCheck();
    } catch {
      this.mensajeError = 'No se pudo inicializar reCAPTCHA. Verifica configuracion de dominio y recarga la pagina.';
      this.recaptchaListo = false;
    }
  }

  private resetearRecaptcha() {
    if (this.recaptchaWidgetId === null) {
      return;
    }
    if (window.grecaptcha) {
      window.grecaptcha.reset(this.recaptchaWidgetId);
    }
    this.captchaToken = '';
  }
}
