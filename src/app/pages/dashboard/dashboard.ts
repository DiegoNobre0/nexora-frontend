import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexGrid,
  ApexTheme
} from "ng-apexcharts";
import { LucideAngularModule } from 'lucide-angular';

// Definindo o tipo das opções para o TypeScript não reclamar
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  theme: ApexTheme;
  colors: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule,LucideAngularModule], 
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "Faturamento",
          data: [1200, 1800, 1100, 2500, 2100, 2800, 1280] // Dados fictícios da semana
        }
      ],
      chart: {
        height: 350,
        type: "area", // Estilo área preenchida fica lindo no Dark Mode
        toolbar: { show: false }, // Remove botões inúteis
        fontFamily: 'Inter, sans-serif',
        background: 'transparent'
      },
      colors: ["#6C4EFF"], // Nosso Roxo Nexora
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth", // Linha arredondada "Premium"
        width: 3
      },
      xaxis: {
        categories: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#94A3B8" } } // Cor $text-secondary
      },
      grid: {
        borderColor: "#334155", // Cor $border
        strokeDashArray: 4
      },
      theme: { mode: "dark" },
      tooltip: {
        theme: "dark",
        x: { show: false }
      }
    };
  }
}