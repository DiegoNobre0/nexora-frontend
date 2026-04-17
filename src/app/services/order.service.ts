import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type {
  Order, OrderFilters, CreateOrderDto, CalculateTotalDto,
  CalculateTotalResult, QueueStatus, DashboardSummary, OrderStatus
} from '../interfaces/order.interface';
import { environment } from '../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;

  // ─── Listagem ─────────────────────────────────────────────
  getOrders(filters?: OrderFilters) {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<{ data: Order[]; meta: any }>(`${this.api}/orders`, { params });
  }

  getOrderById(id: string) {
    return this.http.get<Order>(`${this.api}/orders/${id}`);
  }

  // ─── Criação ──────────────────────────────────────────────
  createOrder(data: CreateOrderDto) {
    return this.http.post<Order>(`${this.api}/orders`, data);
  }

  calculateTotal(data: CalculateTotalDto) {
    return this.http.post<CalculateTotalResult>(`${this.api}/orders/calculate`, data);
  }

  // ─── Atualização de Status ────────────────────────────────
  updateStatus(id: string, status: OrderStatus) {
    return this.http.patch<Order>(`${this.api}/orders/${id}/status`, { status });
  }

  cancelOrder(id: string, reason: string) {
    return this.http.patch<Order>(`${this.api}/orders/${id}/cancel`, { reason });
  }

  // ─── Dashboard e Fila ─────────────────────────────────────
  getQueueStatus() {
    return this.http.get<QueueStatus>(`${this.api}/orders/queue`);
  }

  getDashboardSummary(date?: string) {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<DashboardSummary>(`${this.api}/orders/dashboard`, { params });
  }

  getDailyReport(date: string) {
    return this.http.get<any>(`${this.api}/orders/report/${date}`);
  }
}