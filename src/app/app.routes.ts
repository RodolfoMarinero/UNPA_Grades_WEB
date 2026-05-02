import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import {Home} from './pages/home/home';
import {PerfilComponent} from './pages/perfil/perfil.component';
import {CambiarPassword} from './pages/cambiar-password/cambiar-password';
import {NotificacionesComponent} from './pages/notificaciones/notificaciones.component';
import {CalendarioComponent} from './pages/calendario/calendario';
import { RecuperarPasswordComponent } from './pages/recuperar-password/recuperar-password';
import { RestablecerPasswordComponent } from './pages/restablecer-password/restablecer-password';

export const routes: Routes = [
  // Si la dirección está vacía, llévame al Login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Aquí definimos que la ruta 'login' carga tu componente
  { path: 'login', component: LoginComponent },

  { path: 'perfil', component: PerfilComponent},

  {path: 'cambiar-password', component: CambiarPassword},

  {path: 'recuperar-password', component: RecuperarPasswordComponent},

  {path: 'restablecer-password', component: RestablecerPasswordComponent},

  { path: 'notificaciones', component: NotificacionesComponent},

  { path: 'calendario', component: CalendarioComponent },

  { path: 'home', component: Home }
];
