import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../enviroments/environment';


// ─── Interfaces ───────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company: string;
  };
}

export interface JwtPayload {
  sub: string;
  company_id: string;
  business_db_name: string;
  role: string;
  plan_features: Record<string, unknown>;
}

export interface RegisterData {
  companyName: string;
  userName: string;
  email: string;
  password: string;
  whatsapp: string;
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Sinais públicos — qualquer componente pode ler
  currentUser = signal<LoginResponse['user'] | null>(null);
  isAuthenticated = signal<boolean>(false);
  planFeatures = signal<Record<string, unknown>>({});

  constructor() {
    this.loadSession();
  }

  // ─── Login ────────────────────────────────────────────────
  login(credentials: { email: string; password: string }) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  // ─── Cadastro ─────────────────────────────────────────────
  register(data: RegisterData) {
    return this.http.post(`${environment.apiUrl}/companies`, {
      name: data.companyName,
      admin_name: data.userName,
      admin_email: data.email,
      admin_password: data.password,
      whatsapp_number: data.whatsapp,
    });
  }

  // ─── Logout ───────────────────────────────────────────────
  logout() {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.planFeatures.set({});
    this.router.navigate(['/login']);
  }

  // ─── Helpers públicos ─────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('nexora_token');
  }

  // Decodifica o JWT sem biblioteca externa
  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Verifica se o token ainda é válido (não expirou)
  isTokenValid(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;

    // JWT exp é em segundos, Date.now() em milissegundos
    const expMs = (decoded as any).exp * 1000;
    return Date.now() < expMs;
  }

  // ─── Privados ─────────────────────────────────────────────
  private setSession(response: LoginResponse) {
    localStorage.setItem('nexora_token', response.token);
    localStorage.setItem('nexora_user', JSON.stringify(response.user));

    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);

    // Extrai plan_features do JWT e salva no Signal
    const decoded = this.getDecodedToken();
    if (decoded?.plan_features) {
      this.planFeatures.set(decoded.plan_features);
    }

    this.router.navigate(['/dashboard']);
  }

  private loadSession() {
    const token = this.getToken();
    const user = localStorage.getItem('nexora_user');

    // Se o token existir mas estiver expirado, faz logout limpo
    if (token && !this.isTokenValid()) {
      this.logout();
      return;
    }

    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isAuthenticated.set(true);

      const decoded = this.getDecodedToken();
      if (decoded?.plan_features) {
        this.planFeatures.set(decoded.plan_features);
      }
    }
  }
}