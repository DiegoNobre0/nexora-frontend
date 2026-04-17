import type { Client } from './crm.interface.ts';
import type { Product } from './catalog.interface';

// ─── Enums ────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED';

export type OrderChannel = 'WHATSAPP' | 'WEBSITE' | 'COUNTER' | 'INSTAGRAM';
export type OrderType    = 'DELIVERY' | 'PICKUP' | 'COUNTER';

// ─── Modelos ──────────────────────────────────────────────────

export interface OrderItem {
  id:         string;
  product_id: string;
  product:    Pick<Product, 'name' | 'unit'>;
  quantity:   number;
  unit_price: number;
  discount:   number;
  total:      number;
  notes?:     string;
}

export interface Order {
  id:           string;
  client_id?:   string;
  employee_id?: string;
  address_id?:  string;
  channel:      OrderChannel;
  status:       OrderStatus;
  type:         OrderType;
  subtotal:     number;
  discount:     number;
  delivery_fee: number;
  total:        number;
  notes?:       string;
  is_proforma:  boolean;
  estimated_at?: string;
  delivered_at?: string;
  canceled_at?:  string;
  cancel_reason?: string;
  created_at:   string;
  updated_at:   string;

  // Relações
  client?:   Pick<Client, 'id' | 'name' | 'phone' | 'company_name' | 'type'>;
  address?:  { street: string; number: string; district: string; city: string };
  employee?: { id: string; name: string };
  items:     OrderItem[];
  payments:  Payment[];
}

export interface Payment {
  id:           string;
  method:       string;
  amount:       number;
  status:       string;
  paid_at?:     string;
  installments: number;
}

// ─── Fila ─────────────────────────────────────────────────────

export interface QueueStatus {
  PENDING:     number;
  CONFIRMED:   number;
  PREPARING:   number;
  READY:       number;
  IN_DELIVERY: number;
}

// ─── Dashboard ────────────────────────────────────────────────

export interface DashboardSummary {
  date:           string;
  total_orders:   number;
  total_revenue:  string;
  average_ticket: string;
}

// ─── DTOs ─────────────────────────────────────────────────────

export interface CreateOrderItemDto {
  product_id: string;
  quantity:   number;
  notes?:     string;
}

export interface CreateOrderDto {
  client_id?:   string;
  employee_id?: string;
  address_id?:  string;
  channel:      OrderChannel;
  type:         OrderType;
  items:        CreateOrderItemDto[];
  discount:     number;
  notes?:       string;
  is_proforma?: boolean;
}

export interface OrderFilters {
  status?:    OrderStatus;
  channel?:   OrderChannel;
  client_id?: string;
  date?:      string;
  page?:      number;
  limit?:     number;
}

export interface CalculateTotalDto {
  items:       CreateOrderItemDto[];
  address_id?: string;
  type:        OrderType;
}

export interface CalculateTotalResult {
  subtotal:     number;
  delivery_fee: number;
  total:        number;
  items: {
    product_id: string;
    name:       string;
    quantity:   number;
    unit_price: number;
    total:      number;
  }[];
}

// ─── Metadados de status (para UI) ───────────────────────────

export interface StatusMeta {
  label: string;
  color: string;
  icon:  string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:     { label: 'Aguardando',  color: 'warning', icon: 'clock' },
  CONFIRMED:   { label: 'Confirmado',  color: 'info',    icon: 'check-circle' },
  PREPARING:   { label: 'Preparando',  color: 'purple',  icon: 'chef-hat' },
  READY:       { label: 'Pronto',      color: 'success', icon: 'package-check' },
  IN_DELIVERY: { label: 'Em Entrega',  color: 'blue',    icon: 'truck' },
  DELIVERED:   { label: 'Entregue',    color: 'success', icon: 'circle-check' },
  CANCELED:    { label: 'Cancelado',   color: 'danger',  icon: 'x-circle' },
};