import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  constructor(private http: HttpClient) { }

 registrarPaciente(datosRegistro: any): Observable<any> {
    return this.http.post(this.apiUrl + '/registro', datosRegistro);
  }

  login(datosLogin: any): Observable<any> {
    return this.http.post(this.apiUrl + '/login', datosLogin);
  }

  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken() {
    return localStorage.getItem('token');
  }

  // Alias para que el interceptor reconozca el método sin errores
  getToken() {
    return this.obtenerToken();
  }

  logout(): void {
    localStorage.clear();
  }
}