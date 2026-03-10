import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  
  // Usando Signals para um estado ultra performático
  public lastNotification = signal<any>(null);

  constructor() {
    this.socket = io('http://localhost:3333', {
      autoConnect: false // Vamos conectar só após o login
    });

    this.setupListeners();
  }

  connect(companyId: string) {
    this.socket.io.opts.query = { companyId };
    this.socket.connect();
  }

  private setupListeners() {
    this.socket.on('novo_agendamento', (data) => {
      this.lastNotification.set({ type: 'success', ...data });
    });

    this.socket.on('ai_status', (data) => {
      this.lastNotification.set({ type: 'ai_log', ...data });
    });
  }
}