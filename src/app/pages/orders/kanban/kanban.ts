import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterModule }    from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { OrderService }    from '../../../services/order.service';
import {
  Order, OrderStatus,
  ORDER_STATUS_META
} from '../../../interfaces/order.interface';

interface KanbanColumn {
  status:  OrderStatus;
  label:   string;
  icon:    string;
  color:   string;
  orders:  Order[];
}

// 🔥 DADOS MOCKADOS PARA TESTAR A APLICAÇÃO 🔥
const MOCK_ORDERS: any[] = [
  {
    id: '1111aaaa-0000-0000', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'PENDING', type: 'DELIVERY', channel: 'WHATSAPP', is_proforma: false,
    client: { name: 'João Silva', phone: '(11) 99999-1111' },
    subtotal: 100, discount: 0, delivery_fee: 10, total: 110,
    address: { street: 'Rua das Flores', number: '123', district: 'Centro', city: 'São Paulo' },
    items: [
      { id: 'i1', product: { name: 'Combo Charcutaria Premium' }, quantity: 1, unit_price: 70, total: 70 },
      { id: 'i2', product: { name: 'Cerveja Artesanal IPA' }, quantity: 2, unit_price: 15, total: 30 },
      { id: 'i3', product: { name: 'Geleia de Pimenta' }, quantity: 1, unit_price: 10, total: 10 } // Para testar o "+1 item"
    ]
  },
  {
    id: '2222bbbb-0000-0000', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'CONFIRMED', type: 'PICKUP', channel: 'WEBSITE', is_proforma: false,
    client: { name: 'Maria Oliveira', phone: '(11) 98888-2222' },
    subtotal: 45, discount: 5, delivery_fee: 0, total: 40,
    items: [
      { id: 'i4', product: { name: 'Tábua de Frios P' }, quantity: 1, unit_price: 45, total: 45 }
    ]
  },
  {
    id: '3333cccc-0000-0000', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'PREPARING', type: 'COUNTER', channel: 'COUNTER', is_proforma: false,
    client: null, // Consumidor Final
    subtotal: 120, discount: 0, delivery_fee: 0, total: 120, notes: 'Sem cebola na porção',
    items: [
      { id: 'i5', product: { name: 'Porção Mista' }, quantity: 1, unit_price: 80, total: 80 },
      { id: 'i6', product: { name: 'Refrigerante Lata' }, quantity: 4, unit_price: 10, total: 40 }
    ]
  },
  {
    id: '4444dddd-0000-0000', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'READY', type: 'DELIVERY', channel: 'INSTAGRAM', is_proforma: false,
    client: { name: 'Carlos Santos', phone: '(11) 97777-3333' },
    subtotal: 200, discount: 0, delivery_fee: 15, total: 215,
    address: { street: 'Av. Paulista', number: '1000', district: 'Bela Vista', city: 'São Paulo' },
    items: [
      { id: 'i7', product: { name: 'Kit Churrasco Completo' }, quantity: 1, unit_price: 200, total: 200 }
    ]
  },
  {
    id: '5555eeee-0000-0000', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'IN_DELIVERY', type: 'DELIVERY', channel: 'WHATSAPP', is_proforma: false,
    client: { name: 'Ana Costa', phone: '(11) 96666-4444' },
    employee: { name: 'Motoboy Marcos' },
    subtotal: 80, discount: 0, delivery_fee: 12, total: 92,
    address: { street: 'Rua Augusta', number: '500', district: 'Consolação', city: 'São Paulo' },
    items: [
      { id: 'i8', product: { name: 'Sanduíche Artesanal' }, quantity: 2, unit_price: 40, total: 80 }
    ]
  }
];

@Component({
  selector:    'app-kanban',
  standalone:  true,
  imports:     [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './kanban.html',
  styleUrls:   ['./kanban.scss'],
})
export class KanbanComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);

  // ─── State ──────────────────────────────────────────────
  isLoading      = signal(true);
  selectedOrder  = signal<Order | null>(null);
  isDetailOpen   = signal(false);
  isCancelOpen   = signal(false);
  cancelReason   = signal('');
  refreshTimer?: ReturnType<typeof setInterval>;

  columns = signal<KanbanColumn[]>([
    { status: 'PENDING',     label: 'Aguardando',  icon: 'clock',         color: 'warning', orders: [] },
    { status: 'CONFIRMED',   label: 'Confirmado',  icon: 'check-circle',  color: 'info',    orders: [] },
    { status: 'PREPARING',   label: 'Preparando',  icon: 'chef-hat',      color: 'purple',  orders: [] },
    { status: 'READY',       label: 'Pronto',      icon: 'package-check', color: 'success', orders: [] },
    { status: 'IN_DELIVERY', label: 'Entregando',  icon: 'truck',         color: 'blue',    orders: [] },
  ]);

  // Total de pedidos ativos
  totalActive = computed(() =>
    this.columns().reduce((sum, col) => sum + col.orders.length, 0)
  );

  // ─── Lifecycle ──────────────────────────────────────────
  ngOnInit() {
    this.loadOrders();
    this.refreshTimer = setInterval(() => this.loadOrders(), 30_000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  // ─── Data ───────────────────────────────────────────────
  loadOrders() {
    this.isLoading.set(true);

    // 🔥 USANDO DADOS MOCKADOS COM ATRASO DE 800ms PARA SIMULAR REDE 🔥
    of({ data: MOCK_ORDERS }).pipe(delay(800)).subscribe({
      next: ({ data }) => {
        this.columns.update(cols =>
          cols.map(col => ({
            ...col,
            orders: data.filter((o: any) =>
              o.status === col.status && !o.is_proforma
            ).sort((a: any, b: any) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          }))
        );
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    /* 🚨 CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE 🚨
    this.orderService.getOrders({ status: undefined, limit: 100 }).subscribe({
      next: ({ data }) => { ... },
      error: () => this.isLoading.set(false),
    });
    */
  }

  // ─── Ações ──────────────────────────────────────────────

  advanceOrder(order: Order) {
    const flow: Record<string, OrderStatus> = {
      PENDING:     'CONFIRMED',
      CONFIRMED:   'PREPARING',
      PREPARING:   'READY',
      READY:       'IN_DELIVERY',
      IN_DELIVERY: 'DELIVERED',
    };

    const nextStatus = flow[order.status];
    if (!nextStatus) return;

    // 🔥 SIMULANDO AVANÇO DE STATUS NO MOCK 🔥
    const mockOrder = MOCK_ORDERS.find(o => o.id === order.id);
    if (mockOrder) mockOrder.status = nextStatus;
    
    this.loadOrders();

    /* 🚨 CÓDIGO ORIGINAL COMENTADO 🚨
    this.orderService.updateStatus(order.id, nextStatus).subscribe(() => {
      this.loadOrders();
    });
    */
  }

  openDetail(order: Order) {
    // Garante que o array items existe para evitar aquele erro de .slice
    if (!order.items) order.items = [];
    this.selectedOrder.set(order);
    this.isDetailOpen.set(true);
  }

  closeDetail() {
    this.isDetailOpen.set(false);
    this.selectedOrder.set(null);
  }

  openCancel(order: Order) {
    this.selectedOrder.set(order);
    this.isCancelOpen.set(true);
  }

  closeCancel() {
    this.isCancelOpen.set(false);
    this.cancelReason.set('');
  }

  confirmCancel() {
    const order = this.selectedOrder();
    if (!order || !this.cancelReason()) return;

    // 🔥 SIMULANDO CANCELAMENTO NO MOCK 🔥
    const mockOrder = MOCK_ORDERS.find(o => o.id === order.id);
    if (mockOrder) mockOrder.status = 'CANCELED';
    
    this.closeCancel();
    this.loadOrders();

    /* 🚨 CÓDIGO ORIGINAL COMENTADO 🚨
    this.orderService.cancelOrder(order.id, this.cancelReason()).subscribe(() => {
      this.closeCancel();
      this.loadOrders();
    });
    */
  }

  // ─── Helpers ────────────────────────────────────────────
  getStatusMeta(status: OrderStatus) {
    return ORDER_STATUS_META[status];
  }

  getNextActionLabel(status: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      PENDING:     'Confirmar',
      CONFIRMED:   'Preparar',
      PREPARING:   'Pronto',
      READY:       'Enviar',
      IN_DELIVERY: 'Entregue',
    };
    return labels[status] ?? '';
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
  }
}