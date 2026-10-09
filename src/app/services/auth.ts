import { Injectable, signal, computed } from '@angular/core';

export interface UserSession {
  usuarioId?: number;
  pacienteId?: number;
  profesionalId?: number;
  email: string;
  nombreCompleto: string;
  legajo?: string;
  matricula?: string;
  rol: 'ADMIN' | 'ADMINISTRADOR' | 'MEDICO' | 'PACIENTE';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  // Signal reactivo para el token actual
  private tokenSignal = signal<string | null>(this.getInitialToken());

  // Signal computado para la sesión del usuario
  readonly currentUser = computed<UserSession | null>(() => {
    const token = this.tokenSignal();
    if (!token) return null;
    return this.decodeToken(token);
  });

  // Signal computado para el estado de autenticación
  readonly isAuthenticated = computed<boolean>(() => {
    return this.currentUser() !== null;
  });

  // Signal computado para el rol actual
  readonly currentRole = computed<string | null>(() => {
    return this.currentUser()?.rol || null;
  });

  constructor() {
    // Si no hay token guardado al iniciar, configuramos por defecto la sesión de Operador Administrativo
    // para habilitar el uso inmediato del Panel Administrativo de Mendoza.
    if (!localStorage.getItem(this.TOKEN_KEY)) {
      this.loginAsAdmin();
    }
  }

  private getInitialToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
    this.tokenSignal.set(token);
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.tokenSignal.set(null);
  }

  getPacienteId(): number | null {
    const user = this.currentUser();
    return user?.pacienteId ?? null;
  }

  getRol(): string | null {
    return this.currentRole();
  }

  hasRole(roles: string[]): boolean {
    const current = this.currentRole();
    if (!current) return false;

    // Normalizar roles para compatibilidad entre ADMIN y ADMINISTRADOR
    const normalizedCurrent = current.toUpperCase();
    const normalizedList = roles.map(r => r.toUpperCase());

    const isMatch = normalizedList.some(r => {
      if (r === 'ADMIN' && (normalizedCurrent === 'ADMIN' || normalizedCurrent === 'ADMINISTRADOR')) return true;
      if (r === 'ADMINISTRADOR' && (normalizedCurrent === 'ADMIN' || normalizedCurrent === 'ADMINISTRADOR')) return true;
      return r === normalizedCurrent;
    });

    return isMatch;
  }

  /**
   * Codificación y decodificación segura Base64URL compatible con UTF-8
   */
  private base64UrlEncode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  /**
   * Decodifica un JWT (payload Base64Url) extrayendo las claims estándar del backend de Mendoza
   */
  private decodeToken(token: string): UserSession | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return JSON.parse(token);
      }

      const jsonPayload = this.base64UrlDecode(parts[1]);
      const claims = JSON.parse(jsonPayload);

      // Mapeo seguro de atributos
      return {
        usuarioId: claims.usuarioId || claims.userId,
        pacienteId: claims.pacienteId,
        profesionalId: claims.profesionalId,
        email: claims.email || claims.sub || '',
        nombreCompleto: claims.nombreCompleto || claims.name || (claims.email ? claims.email.split('@')[0] : 'Usuario'),
        legajo: claims.legajo,
        matricula: claims.matricula,
        rol: (claims.rol || 'PACIENTE').toUpperCase()
      };
    } catch (err) {
      console.warn('Error al decodificar token JWT:', err);
      return null;
    }
  }

  /**
   * Genera un JWT sintético estándar firmado para pruebas y cambios rápidos de rol
   */
  private createMockJwt(claims: Record<string, any>): string {
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = this.base64UrlEncode(JSON.stringify({
      ...claims,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 días
    }));
    const fakeSignature = this.base64UrlEncode('mock-signature-mendoza-health');
    return `${header}.${payload}.${fakeSignature}`;
  }

  // --- Helpers de prueba para conmutar roles en vivo ---

  loginAsAdmin(): void {
    const token = this.createMockJwt({
      usuarioId: 1,
      sub: 'admin@saludmza.gob.ar',
      email: 'admin@saludmza.gob.ar',
      nombreCompleto: 'Lic. Mariana García',
      legajo: '8841',
      rol: 'ADMINISTRADOR'
    });
    this.setToken(token);
  }

  loginAsMedico(): void {
    const token = this.createMockJwt({
      usuarioId: 3,
      profesionalId: 1,
      sub: 'roberto.perez@hospital.com',
      email: 'roberto.perez@hospital.com',
      nombreCompleto: 'Dr. Roberto Pérez',
      matricula: 'M-12345',
      rol: 'MEDICO'
    });
    this.setToken(token);
  }

  loginAsPaciente(pacienteId: number = 1): void {
    const token = this.createMockJwt({
      usuarioId: 2,
      pacienteId: pacienteId,
      sub: 'juan.gonzalez@gmail.com',
      email: 'juan.gonzalez@gmail.com',
      nombreCompleto: 'Juan González',
      rol: 'PACIENTE'
    });
    this.setToken(token);
  }
}
