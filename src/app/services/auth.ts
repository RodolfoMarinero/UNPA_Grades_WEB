import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AlumnoData } from '../interfaces/alumno';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient);
  private baseUrl = '/vm2';

  public alumnoActual: AlumnoData | null = null;

  constructor() { }

  // 1. LOGIN: Solo mandamos usuario y pass. Atrapamos el campus de la respuesta.
  login(matricula: string, pass: string): Observable<any> {
    const url = `${this.baseUrl}/auth/login`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json'
    });

    const body = {
      matricula: matricula,
      password: pass
    };

    return this.http.post(url, body, { headers: headers }).pipe(
      tap((respuesta: any) => {
        // Si el login es exitoso, guardamos el token
        if (respuesta && respuesta.token) {
          localStorage.setItem('token', respuesta.token);

          // AQUI ATRAPAMOS EL CAMPUS:
          // OJO: Cambia "respuesta.campus" por el nombre exacto de la variable
          // que te está regresando tu backend de Spring Boot en el JSON.
          // Puede ser respuesta.tenant, respuesta.idCampus, etc.
          if (respuesta.campus) {
            localStorage.setItem('tenant', respuesta.campus);
            console.log('Campus asignado por el backend:', respuesta.campus);
          }
        }
      })
    );
  }

  // 2. OBTENER ALUMNO (Enviando la cabecera del campus)
  getAlumnoCompleto(matricula: string): Observable<AlumnoData> {
    const token = localStorage.getItem('token');
    const tenant = localStorage.getItem('tenant') || ''; // Recuperamos el campus asignado

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-TenantID': tenant // <--- Enviamos el campus que nos dio el backend
    });

    return this.http.get<AlumnoData>(
      `${this.baseUrl}/alumnos/usuario/${matricula}/completo`,
      { headers: headers }
    ).pipe(
      tap(data => {
        this.alumnoActual = data;
      })
    );
  }

  // 3. CAMBIAR CONTRASEÑA (Enviando la cabecera del campus)
  cambiarPassword(matricula: string, passActual: string, passNueva: string): Observable<any> {
    const token = localStorage.getItem('token');
    const tenant = localStorage.getItem('tenant') || '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-TenantID': tenant // <--- Enviamos el campus
    });

    return this.http.put(
      `${this.baseUrl}/usuarios/cambiarpassword/${matricula}/`,
      {
        passwordActual: passActual,
        passwordNueva: passNueva
      },
      { headers: headers }
    );
  }

  // 4. OBTENER AVISOS (Enviando la cabecera del campus)
  getAvisos(): Observable<any> {
    const url = `${this.baseUrl}/notificaciones`;
    const token = localStorage.getItem('token');
    const tenant = localStorage.getItem('tenant') || '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-TenantID': tenant // <--- Enviamos el campus
    });

    return this.http.get(url, { headers: headers });
  }

  // EXTRA: Método para cerrar sesión y limpiar todo
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant');
    this.alumnoActual = null;
  }
}
