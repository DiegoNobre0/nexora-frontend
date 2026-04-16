import { Component, OnInit, inject, signal, computed } from '@angular/core'; // 👈 computed importado
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';
import { Category } from '../categories/categories';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface ProductBarcode {
  id: string;
  code: string;
  unit: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;

  // Financeiro
  price: number;
  price_wholesale?: number;
  cost_price?: number;

  // Estoque
  stock_qty: number;
  stock_min: number;
  unit?: string;

  ncm?: string;
  cfop?: string;

  // Relacionamentos e Status
  category_id: string;
  is_active: boolean;
  category?: Category;
  barcodes?: ProductBarcode[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products implements OnInit {
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);

  // ─── ESTADOS DA LISTAGEM ────────────────────────────────────
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);

  // ─── PAGINAÇÃO E FILTROS ────────────────────────────────────
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');
  selectedStatus = signal<string>('');
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  lowStockCount = signal<number>(0);

  // ─── ESTADOS GERAIS DE MODAIS ───────────────────────────────
  isSaving = signal<boolean>(false);

  // ─── MODAL: MOVIMENTAR ESTOQUE ──────────────────────────────
  isStockModalOpen = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);

  stockOperations = [
    { label: 'Entrada', value: 'IN' },
    { label: 'Saída', value: 'OUT' },
    { label: 'Balanço', value: 'ADJUST' }
  ];

  stockForm = this.fb.nonNullable.group({
    operation: ['IN', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['']
  });

  // ─── MODAL: CRIAR / EDITAR PRODUTO ──────────────────────────
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentId = signal<string | null>(null);
  showFiscal = signal<boolean>(false); // 👈 Toggle da seção fiscal

  // 👈 O formulário que faltava para a tela de criar produto funcionar
  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    unit: ['UN'],
    category_id: [''],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    cost_price: [0],
    price_wholesale: [0],
    stock_qty: [0, Validators.min(0)],
    stock_min: [0, Validators.min(0)],
    ncm: [''],
    cfop: [''],
    is_active: [true]
  });

  // 👈 Cálculo da margem em tempo real integrado com o form
  calculatedMargin = computed(() => {
    // Escuta os valores diretamente do FormGroup
    const price = this.productForm.value.price || 0;
    const cost = this.productForm.value.cost_price || 0;

    if (price <= 0 || cost <= 0) return null;
    return ((price - cost) / price) * 100;
  });

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================
  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.checkLowStock();
  }

  loadCategories() {
    this.catalogService.getCategories().subscribe((res: any) => {
      this.categories.set(res.data || res);
    });
  }

  checkLowStock() {
    this.catalogService.getLowStockAlerts().subscribe((res: any) => {
      const data = res.data || res;
      this.lowStockCount.set(data.length || 0);
    });
  }

  loadProducts(lowStockOnly = false) {
    this.isLoading.set(true);
    const filters: any = { page: this.currentPage(), limit: 10, name: this.searchTerm() };

    if (this.selectedCategory()) filters.category_id = this.selectedCategory();
    if (this.selectedStatus()) filters.is_active = this.selectedStatus() === 'true';
    if (lowStockOnly) filters.low_stock = true;

    this.catalogService.getProducts(filters).subscribe({
      next: (res: any) => {
        this.products.set(res.data);
        this.totalPages.set(res.meta.total_pages);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // ============================================================
  // BUSCA E FILTROS
  // ============================================================
  onSearch() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  filterByLowStock() {
    this.currentPage.set(1);
    this.loadProducts(true);
  }

  // ============================================================
  // AÇÕES RÁPIDAS DA TABELA
  // ============================================================
  toggleProduct(product: Product) {
    const newStatus = !product.is_active;
    this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));

    this.catalogService.pauseProduct(product.id).subscribe({
      error: () => {
        alert('Erro ao atualizar status. Revertendo...');
        this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, is_active: !newStatus } : p));
      }
    });
  }

  // ============================================================
  // MODAL DE CRIAR/EDITAR PRODUTO (Integrado!)
  // ============================================================
  toggleFiscal() {
    this.showFiscal.update(v => !v);
  }

  openModal(product?: Product) {
    if (product) {
      this.isEditing.set(true);
      this.currentId.set(product.id);

      // Se tiver dados fiscais, já abre a aba
      if (product.ncm || product.cfop) this.showFiscal.set(true);

      // Preenche o form
      this.productForm.patchValue({
        name: product.name,
        unit: product.unit || 'UN',
        category_id: product.category_id || '',
        description: product.description || '',
        price: product.price,
        cost_price: product.cost_price || 0,
        price_wholesale: product.price_wholesale || 0,
        stock_qty: product.stock_qty || 0,
        stock_min: product.stock_min || 0,
        ncm: product.ncm || '',
        cfop: product.cfop || '',
        is_active: product.is_active
      });
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.showFiscal.set(false);
      this.productForm.reset({ is_active: true, unit: 'UN', price: 0, cost_price: 0, stock_qty: 0, stock_min: 0 });
    }

    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onSubmit() {
    if (this.productForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const data = this.productForm.getRawValue();

    const request$ = this.isEditing()
      ? this.catalogService.updateProduct(this.currentId()!, data)
      : this.catalogService.createProduct(data);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.checkLowStock();
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        alert('Erro ao salvar os dados do produto.');
        this.isSaving.set(false);
      }
    });
  }

  // ============================================================
  // MODAL DE ESTOQUE (Movimentação Avulsa)
  // ============================================================
  openStockModal(product: Product) {
    this.selectedProduct.set(product);
    this.stockForm.reset({ operation: 'IN', quantity: 1, reason: '' });
    this.isStockModalOpen.set(true);
  }

  closeStockModal() {
    this.isStockModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  onStockSubmit() {
    const product = this.selectedProduct();
    if (this.stockForm.invalid || !product) return;

    this.isSaving.set(true);
    const formValue = this.stockForm.getRawValue();
    const payload = {
      operation: formValue.operation as 'IN' | 'OUT' | 'ADJUST',
      quantity: formValue.quantity,
      reason: formValue.reason
    };

    this.catalogService.updateStock(product.id, payload).subscribe({
      next: (res: any) => {
        this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, stock_qty: res.stock_qty || p.stock_qty } : p));
        this.checkLowStock();
        this.closeStockModal();
        this.isSaving.set(false);
      },
      error: () => {
        alert('Erro ao movimentar o estoque. Verifique os dados.');
        this.isSaving.set(false);
      }
    });
  }

  incrementStock(controlName: string) {
    const currentVal = this.productForm.get(controlName)?.value || 0;
    this.productForm.patchValue({ [controlName]: currentVal + 1 });
  }

  decrementStock(controlName: string) {
    const currentVal = this.productForm.get(controlName)?.value || 0;
    if (currentVal > 0) {
      this.productForm.patchValue({ [controlName]: currentVal - 1 });
    }
  }
}