import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Altere para a porta que seu Fastify está rodando
const API_URL = 'http://localhost:3333/auth'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // --- 📝 REGISTRO ---
  register(formData: any): Observable<any> {
    // 🛠️ TRADUTOR: Mapeia o CamelCase do Front para o Snake_Case do Back
    const payload = {
      company_name: formData.companyName,
      owner_name: formData.userName,
      email: formData.email,
      password: formData.password,
      whatsapp_number: formData.whatsapp // Lembre de adicionar isso no seu backend depois!
    };

    return this.http.post(`${API_URL}/register`, payload);
  }

  // --- 🔐 LOGIN ---
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          this.setUser(response.user);
        }
      })
    );
  }

  // --- 🚪 LOGOUT ---
  logout(): void {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
  }

  // --- 🪪 GERENCIAMENTO DE SESSÃO ---
  setToken(token: string): void {
    localStorage.setItem('nexora_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('nexora_token');
  }

  setUser(user: any): void {
    localStorage.setItem('nexora_user', JSON.stringify(user));
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}