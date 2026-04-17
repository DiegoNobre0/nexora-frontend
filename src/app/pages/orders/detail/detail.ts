import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus, ORDER_STATUS_META } from '../../../interfaces/order.interface';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss'],
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private orderService = inject(OrderService);

  // ─── State ──────────────────────────────────────────────
  isLoading = signal(true);
  isProcessing = signal(false);
  order = signal<Order | null>(null);
  errorMsg = signal<string | null>(null);

  // Computa o atalho do ID para exibição (ex: #A1B2)
  shortId = computed(() => {
    const o = this.order();
    return o ? o.id.split('-')[0].toUpperCase() : '';
  });

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.errorMsg.set('ID do pedido não informado na URL.');
      this.isLoading.set(false);
    }
  }

  loadOrder(id: string) {
    this.isLoading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Não foi possível carregar o pedido. Ele pode ter sido excluído.');
        this.isLoading.set(false);
      }
    });
  }

  // ─── Ações ──────────────────────────────────────────────
  goBack() {
    this.location.back();
  }

  printOrder() {
    window.print();
  }

  advanceStatus() {
    const currentOrder = this.order();
    if (!currentOrder || this.isProcessing()) return;

    const flow: Record<string, OrderStatus> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'IN_DELIVERY',
      IN_DELIVERY: 'DELIVERED',
    };

    const nextStatus = flow[currentOrder.status];
    if (!nextStatus) return;

    this.isProcessing.set(true);
    this.orderService.updateStatus(currentOrder.id, nextStatus).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.isProcessing.set(false);
      },
      error: () => this.isProcessing.set(false)
    });
  }

  cancelOrder() {
    const currentOrder = this.order();
    if (!currentOrder) return;
    
    // Aqui você pode integrar com aquele Modal de Cancelamento que fizemos no Kanban
    const reason = window.prompt('Qual o motivo do cancelamento?');
    if (!reason) return;

    this.isProcessing.set(true);
    this.orderService.cancelOrder(currentOrder.id, reason).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.isProcessing.set(false);
      },
      error: () => this.isProcessing.set(false)
    });
  }

  // ─── Helpers ────────────────────────────────────────────
  getStatusMeta(status: OrderStatus) {
    return ORDER_STATUS_META[status];
  }

  getNextActionLabel(status: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      PENDING: 'Confirmar Pedido',
      CONFIRMED: 'Iniciar Preparo',
      PREPARING: 'Marcar como Pronto',
      READY: 'Despachar para Entrega',
      IN_DELIVERY: 'Confirmar Entrega',
    };
    return labels[status] ?? '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
  }
}