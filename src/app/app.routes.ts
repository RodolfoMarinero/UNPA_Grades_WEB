import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import {Home} from './pages/home/home';
import {PerfilComponent} from './pages/perfil/perfil.component';
import {CredencialComponent} from './pages/credencial/credencial.component';
import {CambiarPassword} from './pages/cambiar-password/cambiar-password';
import {NotificacionesComponent} from './pages/notificaciones/notificaciones.component';
import {CalendarioComponent} from './pages/calendario/calendario';
import { RecuperarPasswordComponent } from './pages/recuperar-password/recuperar-password';
import { RestablecerPasswordComponent } from './pages/restablecer-password/restablecer-password';
import { ReportarAccesoNoAutorizadoComponent } from './pages/reportar-acceso-no-autorizado/reportar-acceso-no-autorizado';
import { CorchoComponent } from './pages/corcho/corcho.component';

export const routes: Routes = [
  // Si la dirección está vacía, llévame al Login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Aquí definimos que la ruta 'login' carga tu componente
  { path: 'login', component: LoginComponent },

  { path: 'perfil', component: PerfilComponent},
  
  {path: 'credencial', component: CredencialComponent},

  {path: 'cambiar-password', component: CambiarPassword},

  {path: 'recuperar-password', component: RecuperarPasswordComponent},

  {path: 'restablecer-password', component: RestablecerPasswordComponent},

  {path: 'reportar-acceso-no-autorizado', component: ReportarAccesoNoAutorizadoComponent},

  { path: 'notificaciones', component: NotificacionesComponent},

  { path: 'calendario', component: CalendarioComponent },

  { path: 'corcho', component: CorchoComponent },

  { path: 'home', component: Home }
];
