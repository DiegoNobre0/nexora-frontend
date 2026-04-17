import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NxDialogComponent } from '../../../components/nx-dialog/nx-dialog';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { Category, Product } from '../../../interfaces/catalog.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatSelectModule,
    MatFormFieldModule,
    NxDialogComponent
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

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

  // ─── MODAIS UNIVERSAIS (Confirmação e Erro) ─────────────────
  isConfirmModalOpen = signal(false);
  itemToDelete = signal<Product | null>(null);
  isDeleting = signal(false);
  

  showErrorModal = signal(false);
  errorMessage = signal('');

  // ─── MODAL: MOVIMENTAR ESTOQUE ──────────────────────────────
  isStockModalOpen = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);

  // ─── SINAIS DE CONTROLE DE IMAGEM ───────────────────────────
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

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
  showFiscal = signal<boolean>(false);

  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    unit: ['UN'],
    category_ids: [[] as string[]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    cost_price: [0],
    price_wholesale: [0],
    stock_qty: [0, Validators.min(0)],
    stock_min: [0, Validators.min(0)],
    ncm: [''],
    cfop: [''],
    is_active: [true],
    barcodes: this.fb.array([])
  });

  calculatedMargin = computed(() => {
    const price = this.productForm.value.price || 0;
    const cost = this.productForm.value.cost_price || 0;
    if (price <= 0 || cost <= 0) return null;
    return ((price - cost) / price) * 100;
  });


  // ─── GETTERS E CONTROLES DO FORMARRAY (BARCODES) ─────────────
  get barcodes(): FormArray {
    return this.productForm.get('barcodes') as FormArray;
  }

  addBarcode(code = '', unit = 'UN') {
    this.barcodes.push(this.fb.group({
      code: [code, Validators.required],
      unit: [unit]
    }));
  }

  removeBarcode(index: number) {
    this.barcodes.removeAt(index);
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.checkLowStock();
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400), // Espera 400ms após o usuário parar de digitar
      distinctUntilChanged() // Só faz a requisição se o texto for diferente da última busca
    ).subscribe((searchTerm) => {
      this.currentPage.set(1); // Volta para a página 1
      this.loadProducts();     // Faz a busca real no backend
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value); // Atualiza o seu signal para o input não perder o valor
    this.searchSubject.next(value); // Envia a letra para o canal (que vai aplicar o delay de 400ms)
  }

  ngOnDestroy() {
    // Boa prática: limpa a inscrição quando sair da tela
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
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

// Helper para formatar a exibição das categorias na tabela
  getCategoryNames(product: Product): string {
    if (!product.categories || product.categories.length === 0) return '—';
    return product.categories.map(c => c.name).join(', ');
  }

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

  toggleProduct(product: Product) {
    const newStatus = !product.is_active;
    this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));

    this.catalogService.pauseProduct(product.id).subscribe({
      error: () => {
        this.showError('Erro ao atualizar status. Revertendo...');
        this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, is_active: !newStatus } : p));
      }
    });
  }

  toggleFiscal() {
    this.showFiscal.update(v => !v);
  }

  openModal(product?: Product) {
    this.barcodes.clear(); // Limpa os barcodes residuais
    this.imagePreview.set(null);
    this.selectedFile.set(null);

    if (product) {
      this.isEditing.set(true);
      this.currentId.set(product.id);
      if (product.ncm || product.cfop) this.showFiscal.set(true);

      this.imagePreview.set(product.image_url || null);

      // Prepara os IDs das categorias para o mat-select múltiplo
      const categoryIds = product.categories?.map(c => c.id) || [];

      this.productForm.patchValue({
        name: product.name,
        unit: product.unit || 'UN',
        category_ids: categoryIds,
        description: product.description || '',
        price: Number(product.price),
        cost_price: Number(product.cost_price) || 0,
        price_wholesale: Number(product.price_wholesale) || 0,
        stock_qty: product.stock_qty || 0,
        stock_min: product.stock_min || 0,
        ncm: product.ncm || '',
        cfop: product.cfop || '',
        is_active: product.is_active
      });

      // Popula o FormArray com os barcodes vindos do banco
      product.barcodes?.forEach(bc => this.addBarcode(bc.code, bc.unit));
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.showFiscal.set(false);
      this.productForm.reset({ 
        is_active: true, 
        unit: 'UN', 
        price: 0, 
        cost_price: 0, 
        stock_qty: 0, 
        stock_min: 0,
        category_ids: []
      });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // ─── DELETAR PRODUTO (MODAL UNIVERSAL) ──────────────────────
  openDeleteConfirm(product: Product) {
    this.itemToDelete.set(product);
    this.isConfirmModalOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isConfirmModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  confirmDelete() {
    const product = this.itemToDelete();
    if (!product) return;

    this.isDeleting.set(true);

    this.catalogService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(prods => prods.filter(p => p.id !== product.id));
        this.closeDeleteConfirm();
        this.isDeleting.set(false);
      },
      error: (err: any) => {
        console.error('Erro ao deletar produto:', err);
        const msg = err.error?.message || 'Erro ao excluir o produto. Ele pode estar vinculado a outras áreas do sistema.';
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.showError(msg);
      }
    });
  }

  // ─── SALVAR PRODUTO ───────────────────────────────────────
  onSubmit() {
    
    if (this.productForm.invalid || this.isSaving()) {
      this.productForm.markAllAsTouched();
      return;
    }
    
    this.isSaving.set(true);
    const formValues = this.productForm.getRawValue();
    
    // Delega a montagem complexa do FormData
    const formData: any = this.buildFormData(formValues, this.selectedFile());
    

    const request$ = this.isEditing()
      ? this.catalogService.updateProduct(this.currentId()!, formData)
      : this.catalogService.createProduct(formData);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.checkLowStock();
        this.closeModal();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error(err);
        this.showError('Erro ao salvar os dados do produto. Verifique sua conexão.');
        this.isSaving.set(false);
      }
    });
  }


private buildFormData(formValues: any, file: File | null): FormData {
    const formData = new FormData();

    Object.entries(formValues).forEach(([key, value]) => {
      // Ignora nulos e vazios
      if (value === null || value === undefined || value === '') return;

      // 🚨 A MÁGICA ESTÁ AQUI: Agrupamos os arrays numa única string JSON 🚨
      if ((key === 'category_ids' || key === 'barcodes') && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } 
      else {
        // Campos normais (nome, preço, etc)
        formData.append(key, (value as any).toString());
      }
    });

    if (file) {
      formData.append('image', file);
    }

    return formData;
  }

  // ─── MODAL DE ESTOQUE ───────────────────────────────────────
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
        this.showError('Erro ao movimentar o estoque. Verifique os dados.');
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview.set(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  // ─── CONTROLE DO MODAL DE ERRO ────────────────────────────
  showError(msg: string) {
    this.errorMessage.set(msg);
    this.showErrorModal.set(true);
  }

  closeErrorModal() {
    this.showErrorModal.set(false);
    this.errorMessage.set('');
  }
}