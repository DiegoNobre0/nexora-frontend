import { CommonModule } from '@angular/common';
import { Component, computed, signal, OnInit, HostListener } from '@angular/core';
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


  // ⚙️ CONFIGURAÇÃO DO CLIENTE (No futuro, você busca isso da sua API)
  configSalao = {
    horaAbertura: 8,  // 08:00
    horaFechamento: 20, // 20:00
    intervaloMinutos: 15 // Pula de 15 em 15 minutos
  };

  horarios = this.gerarGradeHorarios(
    this.configSalao.horaAbertura,
    this.configSalao.horaFechamento,
    this.configSalao.intervaloMinutos
  );

  gerarGradeHorarios(inicio: number, fim: number, intervalo: number): string[] {
    const grade: string[] = [];
    let horaAtual = inicio;
    let minutoAtual = 0;

    // Roda o loop até chegar na hora de fechamento
    while (horaAtual < fim || (horaAtual === fim && minutoAtual === 0)) {
      const hStr = horaAtual.toString().padStart(2, '0');
      const mStr = minutoAtual.toString().padStart(2, '0');
      grade.push(`${hStr}:${mStr}`);

      minutoAtual += intervalo;

      // Vira a hora quando passa de 59 minutos
      if (minutoAtual >= 60) {
        minutoAtual -= 60;
        horaAtual++;
      }
    }
    return grade;
  }

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


  ngOnInit() {
    setInterval(() => this.now.set(new Date()), 60000);
    this.calcularFatorPixels();
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

  private fatorPixelsPorMinuto = 0;


  getTopPosition(horaInicio: string): number {
    const [h, m] = horaInicio.split(':').map(Number);
    const minutosDesdaAbertura = ((h - this.configSalao.horaAbertura) * 60) + m;
    return (minutosDesdaAbertura * this.fatorPixelsPorMinuto) + 80;
  }

  getHeight(duracaoMinutos: number): number {  
    // Para a altura bater com os blocos que ela cobre
   let altura = duracaoMinutos * this.fatorPixelsPorMinuto;
   let alturaReajuste = altura - 15 //estava passando 15px para baixo, com isso não estava enquadrando.
    return alturaReajuste
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

  // Linha do tempo animada com o novo fator
  linePosition = computed(() => {
    const time = this.now();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    if (hours < this.configSalao.horaAbertura || hours > this.configSalao.horaFechamento
      || this.dataFiltro() !== new Date().toISOString().split('T')[0]) return -1;

    // ✅ usa horaAbertura do config, não o 8 hardcoded
    const totalMinutos = ((hours - this.configSalao.horaAbertura) * 60) + minutes;
    return (totalMinutos * this.fatorPixelsPorMinuto) + 80;
  });

  @HostListener('window:resize')
  onResize() {
    this.calcularFatorPixels();
  }

private calcularFatorPixels() {
  const alturaCelula = 45; // px fixo definido no CSS
  this.fatorPixelsPorMinuto = alturaCelula / this.configSalao.intervaloMinutos;
  // 40 / 15 = 2.6667 px por minuto
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