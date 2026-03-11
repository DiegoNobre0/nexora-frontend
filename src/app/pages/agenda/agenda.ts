import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';


export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';

export interface Appointment {
  id: string;
  clienteNome: string;
  servicoNome: string;
  profissionalId: string;
  inicio: Date; // Ex: 2026-03-10T10:00:00
  fim: Date;    // Ex: 2026-03-10T10:30:00
  status: AppointmentStatus;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})

export class Agenda {
// Estado da Agenda
  dataSelecionada = signal(new Date());
  viewMode = signal<'dia' | 'semana'>('dia');
  
  // Horários (08:00 às 20:00 com intervalos de 30min)
  horarios = Array.from({ length: 25 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  profissionais = signal([
    { id: '1', nome: 'Diego Nobre', avatar: 'DN' },
    { id: '2', nome: 'Arthur Nobre', avatar: 'AN' },
    { id: '3', nome: 'João Silva', avatar: 'JS' }
  ]);

  // Linha de tempo atual (Cálculo dinâmico)
  now = signal(new Date());
  linePosition = computed(() => {
    const time = this.now();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    if (hours < 8 || hours > 20) return -1;
    
    // Cada 30min = 60px de altura no CSS
    const pixelsPerHour = 120; 
    const startHour = 8;
    return (hours - startHour) * pixelsPerHour + (minutes * 2);
  });

  ngOnInit() {
    // Atualiza a linha do tempo a cada minuto
    setInterval(() => this.now.set(new Date()), 60000);
  }

  navegar(dias: number) {
    const novaData = new Date(this.dataSelecionada());
    novaData.setDate(novaData.getDate() + dias);
    this.dataSelecionada.set(novaData);
  }

  abrirNovoAgendamento(prof: any, hora: string) {
  console.log(`Abrindo agendamento para ${prof.nome} às ${hora}`);
  // Aqui futuramente chamaremos o serviço de Modal
  // Por enquanto, vamos apenas garantir que o erro suma
}
}
