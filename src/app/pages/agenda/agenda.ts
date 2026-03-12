import { CommonModule } from '@angular/common';
import { Component, computed, signal, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado';

export interface Profissional {
  id: string;
  nome: string;
  avatar: string;
  cor: string;
}

export interface Appointment {
  id: string;
  clienteNome: string;
  servicoNome: string;
  profissionalId: string;
  dataStr: string;
  horaInicio: string; 
  duracaoMinutos: number; 
  status: AppointmentStatus;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda implements OnInit {
  dataSelecionada = signal(new Date());
  viewMode = signal<'dia' | 'semana'>('dia');
  
  dataFiltro = computed(() => this.dataSelecionada().toISOString().split('T')[0]);

  // Horários (08:00 às 20:00 - Slots de 30min)
  horarios = Array.from({ length: 25 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  profissionais = signal<Profissional[]>([
    { id: '1', nome: 'Diego Nobre', avatar: 'DN', cor: '#6C4EFF' },
    { id: '2', nome: 'Arthur Nobre', avatar: 'AN', cor: '#3B82F6' },
    { id: '3', nome: 'João Silva', avatar: 'JS', cor: '#10B981' }
  ]);

  // 🗄️ DADOS MOCKADOS COM TESTE DE HORÁRIO QUEBRADO (Ex: 08:40)
  todosAgendamentos = signal<Appointment[]>([
    { id: 'a1', clienteNome: 'Marcos Paulo', servicoNome: 'Corte Degradê', profissionalId: '2', dataStr: this.dataFiltro(), horaInicio: '09:00', duracaoMinutos: 45, status: 'confirmado' },
    { id: 'a2', clienteNome: 'Felipe Santos', servicoNome: 'Barboterapia', profissionalId: '3', dataStr: this.dataFiltro(), horaInicio: '11:00', duracaoMinutos: 60, status: 'pendente' },
    // 👇 Exemplo de horário muito específico para você ver a precisão da matemática!
    { id: 'a4', clienteNome: 'Pedro', servicoNome: 'Sobrancelha', profissionalId: '1', dataStr: this.dataFiltro(), horaInicio: '08:40', duracaoMinutos: 15, status: 'cancelado' }
  ]);

  agendamentosDoDia = computed(() => {
    return this.todosAgendamentos().filter(a => a.dataStr === this.dataFiltro());
  });

  now = signal(new Date());
  
  // Linha do tempo animada (Soma 80px do Header)
  linePosition = computed(() => {
    const time = this.now();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    if (hours < 8 || hours > 20 || this.dataFiltro() !== new Date().toISOString().split('T')[0]) return -1;
    
    const totalMinutos = ((hours - 8) * 60) + minutes;
    return (totalMinutos * 2) + 80; 
  });

  ngOnInit() {
    setInterval(() => this.now.set(new Date()), 60000);
  }

  navegar(dias: number) {
    const novaData = new Date(this.dataSelecionada());
    novaData.setDate(novaData.getDate() + dias);
    this.dataSelecionada.set(novaData);
  }

  // --- 📐 CÁLCULOS VISUAIS EXATOS (MILIMÉTRICOS) ---

  // Retorna a coluna exata usando grid-column
  getColumnIndex(profissionalId: string): string {
    const index = this.profissionais().findIndex(p => p.id === profissionalId);
    return `${index + 2} / span 1`; 
  }

  // 1 min = 2px. Subtraímos 8h (início), multiplicamos e SOMAMOS OS 80px DO CABEÇALHO.
  getTopPosition(horaInicio: string): number {
    const [h, m] = horaInicio.split(':').map(Number);
    const minutosDesdeAs8 = ((h - 8) * 60) + m;
    return (minutosDesdeAs8 * 2) + 80; 
  }

  // Altura proporcional: 15 min = 30px
  getHeight(duracaoMinutos: number): number {
    return duracaoMinutos * 2;
  }

  calcularFim(horaInicio: string, duracaoMinutos: number): string {
    const [h, m] = horaInicio.split(':').map(Number);
    const dataObj = new Date();
    dataObj.setHours(h, m + duracaoMinutos);
    return `${dataObj.getHours().toString().padStart(2, '0')}:${dataObj.getMinutes().toString().padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
  }

  // --- 🖱️ LÓGICA DE DRAG AND DROP KANBAN ---
  
  draggedAppointment: Appointment | null = null;

  onDragStart(apt: Appointment) {
    this.draggedAppointment = apt;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); 
  }

  onDrop(event: DragEvent, profissionalId: string, novaHoraInicio: string) {
    event.preventDefault();
    if (!this.draggedAppointment) return;

    const dragApt = this.draggedAppointment;
    const inicioNovo = this.timeToMinutes(novaHoraInicio);
    const fimNovo = inicioNovo + dragApt.duracaoMinutos;

    const temConflito = this.todosAgendamentos().some(apt => {
      if (apt.id === dragApt.id || apt.profissionalId !== profissionalId || apt.dataStr !== this.dataFiltro()) return false;
      const inicioExistente = this.timeToMinutes(apt.horaInicio);
      const fimExistente = inicioExistente + apt.duracaoMinutos;
      return inicioNovo < fimExistente && inicioExistente < fimNovo;
    });

    if (temConflito) {
      alert('Não é possível encaixar: Este profissional já tem um atendimento nesse horário!');
      this.draggedAppointment = null;
      return;
    }

    const updatedApts = this.todosAgendamentos().map(apt => {
      if (apt.id === dragApt.id) return { ...apt, profissionalId: profissionalId, horaInicio: novaHoraInicio };
      return apt;
    });

    this.todosAgendamentos.set(updatedApts);
    this.draggedAppointment = null;
  }

  abrirNovoAgendamento(prof: Profissional, hora: string) {
    console.log(`Abrindo Modal: Agendamento para ${prof.nome} às ${hora}`);
  }
}