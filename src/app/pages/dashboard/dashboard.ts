import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart,
  ApexXAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexTheme, ApexPlotOptions, ApexLegend, ApexYAxis
} from "ng-apexcharts";
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

// Imports do Angular Material (Com o MatInputModule adicionado!)
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  theme: ApexTheme;
  colors: string[];
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    LucideAngularModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule // 👈 Aqui está a solução do erro do FormFieldControl!
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {

  @ViewChild("areaChart") areaChart!: ChartComponent;
  @ViewChild("barChart") barChart!: ChartComponent;

  public chartOptions: Partial<ChartOptions>;
  public barChartOptions: Partial<ChartOptions>;

  viewTab = signal<'faturamento' | 'despesas'>('faturamento');

  selectedDate = new Date(); // Data real atual
  isCurrentWeek = true; // Flag para saber se estamos vendo a semana ou o mês cheio

  // 🏆 Dados Mockados para as Tabelas
  topProfissionais = [
    { nome: 'Arthur Nobre', especialidade: 'Degradê & Barba', agendamentos: 145, receita: 'R$ 4.350', avatar: 'AN', cor: '#3B82F6' },
    { nome: 'João Silva', especialidade: 'Corte Clássico', agendamentos: 120, receita: 'R$ 3.600', avatar: 'JS', cor: '#10B981' },
    { nome: 'Marcos Paulo', especialidade: 'Colorimetria', agendamentos: 85, receita: 'R$ 4.100', avatar: 'MP', cor: '#F59E0B' }
  ];

  topServicos = [
    { nome: 'Corte Degradê', categoria: 'Corte', qtd: 320, valor: '11.200', trend: '+15%', up: true },
    { nome: 'Barboterapia', categoria: 'Barba', qtd: 180, valor: '6.300', trend: '+8%', up: true },
    { nome: 'Platinado', categoria: 'Química', qtd: 45, valor: '5.400', trend: '-2%', up: false }
  ];

  constructor() {
    // 1. Inicializa as configurações base (sem dados)
    this.chartOptions = this.getAreaConfig();
    this.barChartOptions = this.getBarConfig();

    // 2. Chama a função inteligente para preencher os dados iniciais (Semana Atual)
    this.fetchDataForPeriod();
  }

  setTab(tab: 'faturamento' | 'despesas') {
    this.viewTab.set(tab);
  }

  // 🚀 Lógica do Angular Material Datepicker
  onMonthSelected(event: Date, picker: MatDatepicker<Date>) {
    // 1. Pega a data selecionada no calendário do Material
    this.selectedDate = event;
    this.isCurrentWeek = false;

    // 2. FECHA o calendário (para não ir para a tela de escolher o dia)
    picker.close();

    // 3. Atualiza os gráficos
    this.fetchDataForPeriod();
  }

  // Retorna o texto amigável (Ex: "Março de 2026")
  get displayMonthYear(): string {
    const texto = this.selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1); // Capitaliza a primeira letra
  }

  // Disparado ao clicar em "Semana Atual"
  setSemanaAtual() {
    this.selectedDate = new Date(); // Volta para o "agora"
    this.isCurrentWeek = true;
    this.fetchDataForPeriod();
  }

  // Simulador de requisição HTTP baseada na data real
  fetchDataForPeriod() {
    let novasCategorias: string[] = [];
    let faturamentoData: number[] = [];
    let lucroData: number[] = [];
    let despesaData: number[] = [];

    if (this.isCurrentWeek) {
      // 📅 VISÃO SEMANAL (Segunda a Domingo)
      novasCategorias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      faturamentoData = [1200, 1800, 1100, 2500, 2100, 2800, 1280];
      lucroData = [1000, 1500, 900, 2000, 1700, 2300, 1000];
      despesaData = [200, 300, 200, 500, 400, 500, 280];

    } else {
      // 📆 VISÃO MENSAL (Dias 1 a 30) - Pegamos o mês escolhido
      const diasNoMes = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0).getDate();

      // Cria o array de dias ["1", "2", "3" ... "30"]
      novasCategorias = Array.from({ length: diasNoMes }, (_, i) => (i + 1).toString());

      // Gera dados fictícios para cada dia do mês (Para simular o backend)
      const variacao = this.selectedDate.getMonth() % 2 === 0 ? 0.8 : 1.2;

      for (let i = 0; i < diasNoMes; i++) {
        const baseFaturamento = Math.floor((Math.random() * 800 + 400) * variacao);
        faturamentoData.push(baseFaturamento);
        lucroData.push(Math.floor(baseFaturamento * 0.75)); // Lucro é 75%
        despesaData.push(Math.floor(baseFaturamento * 0.25)); // Despesa é 25%
      }
    }

    // 🚀 ATUALIZA OS GRÁFICOS (Recriando os objetos para o Angular detectar a mudança)
    this.chartOptions = {
      ...this.chartOptions,
      series: [{ name: "Faturamento", data: faturamentoData }],
      xaxis: { ...this.chartOptions.xaxis, categories: novasCategorias }
    };

    this.barChartOptions = {
      ...this.barChartOptions,
      series: [{ name: "Lucro", data: lucroData }, { name: "Despesa", data: despesaData }],
      xaxis: { ...this.barChartOptions.xaxis, categories: novasCategorias }
    };
  }

  // --- CONFIGURAÇÕES BASE ---
  private getAreaConfig(): Partial<ChartOptions> {
    return {
      series: [], // Começa vazio, a função preenche
      chart: { height: 320, type: "area", toolbar: { show: false }, fontFamily: 'Inter, sans-serif', background: 'transparent' },
      colors: ["#6C4EFF"],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: { categories: [], labels: { style: { colors: "#94A3B8" } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: "#94A3B8" }, formatter: (val) => "R$ " + val.toLocaleString('pt-BR') } },
      grid: { borderColor: "#334155", strokeDashArray: 4 },
      theme: { mode: "dark" },
      tooltip: { theme: "dark", x: { show: false }, y: { formatter: (val) => "R$ " + val.toLocaleString('pt-BR') } }
    };
  }

  private getBarConfig(): Partial<ChartOptions> {
    return {
      series: [], // Começa vazio
      chart: { type: "bar", height: 320, stacked: false, toolbar: { show: false }, background: 'transparent' },
      colors: ["#6C4EFF", "#EF4444"],
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: [], labels: { style: { colors: "#94A3B8" } } },
      yaxis: { labels: { style: { colors: "#94A3B8" }, formatter: (val) => "R$ " + val.toLocaleString('pt-BR') } },
      grid: { borderColor: "#334155", strokeDashArray: 4 },
      theme: { mode: "dark" },
      legend: { position: 'top', labels: { colors: '#F8FAFC' } },
      tooltip: { theme: "dark", y: { formatter: (val) => "R$ " + val.toLocaleString('pt-BR') } }
    };
  }
}