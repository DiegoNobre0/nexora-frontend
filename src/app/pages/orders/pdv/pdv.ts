import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../../interfaces/catalog.interface';
import { CatalogService } from '../../../services/catalog.service';
import { OrderService } from '../../../services/order.service';
import { CreateOrderItemDto } from '../../../interfaces/order.interface';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

@Component({
  selector: 'app-pdv',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './pdv.html',
  styleUrls: ['./pdv.scss'],
})
export class PdvComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly orderService = inject(OrderService);

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  // ─── Drag & Scroll de Categorias ──────────────────────────
  @ViewChild('categoryContainer') categoryContainer!: ElementRef;
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  // ─── Catálogo ───────────────────────────────────────────
  products = signal<Product[]>([]);
  categories = signal<any[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  activeCategory = signal('');

  // ─── Criação de Novo Cliente (Mini-Form) ─────────────────
  isCreatingClient = signal(false);
  newClientPhone = signal('');
  newClientName = signal('');
  newClientZip      = signal('');
  newClientStreet   = signal('');
  newClientNumber   = signal('');
  newClientDistrict = signal('');
  newClientCity     = signal('');
  newClientState    = signal('');

  // ─── Carrinho ───────────────────────────────────────────
  cart = signal<CartItem[]>([]);

  cartTotal = computed(() =>
    this.cart().reduce((sum, item) =>
      sum + (Number(item.product.price) * item.quantity), 0
    )
  );

  cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  // ─── Checkout ───────────────────────────────────────────
  orderType = signal<'COUNTER' | 'DELIVERY' | 'PICKUP'>('COUNTER');
  isCheckoutOpen = signal(false);
  isProcessing = signal(false);
  selectedPayment = signal<string>('PIX');
  discount = signal(0);
  orderNotes = signal('');
  orderSuccess = signal(false);
  lastOrderId = signal('');

  // Controle de Endereço (se for DELIVERY)
  deliveryFee = signal(0);

  finalTotal = computed(() => {
    const subtotal = this.cartTotal();
    const frete = this.orderType() === 'DELIVERY' ? this.deliveryFee() : 0;
    return Math.max(0, subtotal + frete - this.discount());
  });

  saveNewClient() {
    // Aqui você chama o POST /clients do seu backend
    // this.crmService.createClient({ type: 'PF', name: this.newClientName(), phone: this.newClientPhone() })
    // Ao dar sucesso, você seta ele como selectedClient() e fecha o form.
  }


  removeClient(){}

  // Controle de Cliente
  clientSearchTerm = signal('');
  foundClients = signal<any[]>([]); // Lista de clientes da busca
  selectedClient = signal<any | null>(null);

  // Produtos filtrados por busca e categoria
  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const cat = this.activeCategory();

    return this.products().filter(p => {
      const matchName = !term || p.name.toLowerCase().includes(term);
      const matchCat = !cat || p.categories?.some((c: any) => c.id === cat);

      return p.is_active && matchName && matchCat;
    });
  });

  paymentMethods = [
    { value: 'CASH', label: 'Dinheiro', icon: 'banknote' },
    { value: 'PIX', label: 'Pix', icon: 'qr-code' },
    { value: 'CREDIT_CARD', label: 'Crédito', icon: 'credit-card' },
    { value: 'DEBIT_CARD', label: 'Débito', icon: 'credit-card' },
    { value: 'VR', label: 'VR/VA', icon: 'utensils' },
  ];

  ngOnInit() {
    this.loadCatalog();

    // Configura a busca de clientes com debounce
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term.length >= 3) {
        // Chame o seu backend para buscar clientes:
        // this.crmService.getClients({ search: term }).subscribe(...)
        console.log('Buscando cliente:', term);
      } else {
        this.foundClients.set([]);
      }
    });
  }

  onClientSearch(term: string) {
    this.clientSearchTerm.set(term);
    this.searchSubject.next(term);
  }

  selectClient(client: any) {
    this.selectedClient.set(client);
    this.clientSearchTerm.set('');
    this.foundClients.set([]);

    // Se ele tem endereço padrão, você já pode calcular o frete aqui!
  }

  loadCatalog() {
    this.isLoading.set(true);

    // 1. Carrega os Produtos (Extraindo o .data)
    this.catalogService.getProducts({ is_active: true, limit: 100 }).subscribe({
      next: (response: any) => {
        // MUDANÇA AQUI: response.data contém o Array real
        this.products.set(response.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // 2. Carrega as Categorias (Extraindo o .data)
    this.catalogService.getCategories({ is_active: true }).subscribe({
      next: (response: any) => {
        // MUDANÇA AQUI também!
        this.categories.set(response.data || []);
      },
    });
  }

  // ─── Carrinho ───────────────────────────────────────────
  addToCart(product: Product) {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        return items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { product, quantity: 1, notes: '' }];
    });
  }

  updateQuantity(productId: string, delta: number) {
    this.cart.update(items =>
      items
        .map(i => i.product.id === productId
          ? { ...i, quantity: i.quantity + delta }
          : i
        )
        .filter(i => i.quantity > 0)
    );
  }

  removeFromCart(productId: string) {
    this.cart.update(items => items.filter(i => i.product.id !== productId));
  }

  clearCart() {
    this.cart.set([]);
    this.discount.set(0);
    this.orderNotes.set('');
    this.orderSuccess.set(false);
  }

  // ─── Checkout ───────────────────────────────────────────
  openCheckout() {
    if (this.cart().length === 0) return;
    this.isCheckoutOpen.set(true);
  }

  closeCheckout() {
    this.isCheckoutOpen.set(false);
    if (this.orderSuccess()) this.clearCart();
  }

  confirmOrder() {
    if (this.isProcessing() || this.cart().length === 0) return;
    this.isProcessing.set(true);

    const items: CreateOrderItemDto[] = this.cart().map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      notes: i.notes || undefined,
    }));

    this.orderService.createOrder({
      channel: 'COUNTER',
      type: 'COUNTER',
      items,
      discount: this.discount(),
      notes: this.orderNotes() || undefined,
    }).subscribe({
      next: (order) => {
        this.lastOrderId.set(order.id.split('-')[0].toUpperCase());
        this.orderSuccess.set(true);
        this.isProcessing.set(false);
      },
      error: () => this.isProcessing.set(false),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
  }

  startDrag(e: MouseEvent) {
    this.isDragging = false; // Começa assumindo que é só um clique
    this.startX = e.pageX - this.categoryContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.categoryContainer.nativeElement.scrollLeft;
  }

  onDrag(e: MouseEvent) {
    // e.buttons === 1 significa que o botão esquerdo do mouse está pressionado
    // Se não estiver pressionado, não faz nada!
    if (e.buttons !== 1) return;

    const x = e.pageX - this.categoryContainer.nativeElement.offsetLeft;
    const walk = (x - this.startX);

    // Só considera "Arrasto" se o mouse moveu mais de 5 pixels (ignora tremidinhas)
    if (Math.abs(walk) > 5) {
      this.isDragging = true;
      this.categoryContainer.nativeElement.scrollLeft = this.scrollLeft - (walk * 1.5);
    }
  }

  scrollCategories(amount: number) {
    this.categoryContainer.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }


  selectCategory(categoryId: string, event: Event) {
    if (this.isDragging) {
      // Se estava arrastando, nós matamos o clique aqui!
      event.preventDefault();
      event.stopPropagation();
      // Dá um micro-delay para resetar e evitar duplo clique acidental
      setTimeout(() => this.isDragging = false, 50);
      return;
    }

    // Se não estava arrastando, o clique é válido!
    this.activeCategory.set(categoryId);
  }
}