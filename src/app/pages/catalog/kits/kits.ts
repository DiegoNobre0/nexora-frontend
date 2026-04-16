import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';
import { Product } from '../products/products';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-kits',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    LucideAngularModule, 
    MatSelectModule, 
    MatFormFieldModule
  ],
  templateUrl: './kits.html',
  styleUrl: './kits.scss'
})
export class KitsComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);

  // ─── ESTADOS GERAIS DA LISTAGEM ─────────────────────────────
  kits = signal<any[]>([]); // Array principal da grid
  isLoading = signal(true);
  availableProducts = signal<Product[]>([]);

  // ─── CONTROLES DO MODAL ─────────────────────────────────────
  isModalOpen = signal(false); // 👈 Trocado de showForm para isModalOpen
  isEditing = signal(false);
  currentKitId = signal<string | null>(null);
  isSaving = signal(false);

  // ─── ESTADOS INTERNOS DO FORMULÁRIO ─────────────────────────
  selectedItems = signal<{ product: Product; qty: number }[]>([]);
  images = signal<File[]>([]);
  previews = signal<string[]>([]);

  kitForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    is_active: [true]
  });

  // ─── CÁLCULOS FINANCEIROS ─────────────────────────────────
  totalCost = computed(() => {
    return this.selectedItems().reduce((sum, item) => sum + ((item.product.cost_price || 0) * item.qty), 0);
  });

  margin = computed(() => {
    // Para aceitar strings ou números caso o input vire texto temporariamente
    const price = Number(this.kitForm.value.price) || 0;
    const cost = this.totalCost();
    
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  });

  ngOnInit() {
    this.loadKits();
    this.loadProducts();
  }

  // ─── CARREGAMENTO DE DADOS ────────────────────────────────
  loadKits() {
    this.isLoading.set(true);
    this.catalogService.getPromoKits().subscribe({
      next: (res: any) => {
        this.kits.set(res.data || res); 
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar kits:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadProducts() {
    this.catalogService.getProducts({ limit: 100, is_active: true }).subscribe((res: any) => {
      this.availableProducts.set(res.data || res);
    });
  }

  // ─── CONTROLE DO MODAL ────────────────────────────────────
  openModal() {
    this.isModalOpen.set(true);
    this.isEditing.set(false);
    this.currentKitId.set(null);
    this.resetFormState();
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetFormState();
  }

  private resetFormState() {
    this.kitForm.reset({ is_active: true, price: 0 });
    this.selectedItems.set([]);
    this.images.set([]);
    this.previews.set([]);
  }

  // ─── AÇÕES DA LISTAGEM (GRID) ─────────────────────────────
  toggleKit(id: string) {
    const kit = this.kits().find(k => k.id === id);
    if (!kit) return;

    const newStatus = !kit.is_active;
    
    // Atualização otimista na UI por enquanto
    this.kits.update(kits => 
      kits.map(k => k.id === id ? { ...k, is_active: newStatus } : k)
    );
  }

  deleteKit(id: string) {
    if (confirm('Tem certeza que deseja excluir este kit?')) {
      this.kits.update(kits => kits.filter(k => k.id !== id)); // Fake delete visual
    }
  }

  editKit(kit: any) {
    alert('Edição de kit em desenvolvimento. Envolve preview de arquivos.');
  }

  // ─── LÓGICA DE IMAGENS ────────────────────────────────────
  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files) return;

    if (this.images().length + files.length > 4) {
      alert('Você pode adicionar no máximo 4 imagens por kit.');
      return;
    }

    Array.from(files).forEach((file: any) => {
      this.images.update(prev => [...prev, file]);
      
      const reader = new FileReader();
      reader.onload = (e: any) => this.previews.update(p => [...p, e.target.result]);
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.images.update(imgs => imgs.filter((_, i) => i !== index));
    this.previews.update(prevs => prevs.filter((_, i) => i !== index));
  }

  // ─── LÓGICA DE COMPOSIÇÃO ─────────────────────────────────
  addProduct(productId: string) {
    if (!productId) return;

    const product = this.availableProducts().find(p => p.id === productId);
    if (!product) return;

    const existingItem = this.selectedItems().find(item => item.product.id === productId);
    
    if (existingItem) {
      this.updateQty(productId, 1);
    } else {
      this.selectedItems.update(items => [...items, { product, qty: 1 }]);
    }
  }

  updateQty(productId: string, delta: number) {
    this.selectedItems.update(items => items.map(item => {
      if (item.product.id === productId) {
        const newQty = item.qty + delta;
        return { ...item, qty: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  }

  removeProduct(productId: string) {
    this.selectedItems.update(items => items.filter(i => i.product.id !== productId));
  }

  // ─── SALVAR NO BACKEND ────────────────────────────────────
  onSubmit() {
    if (this.kitForm.invalid || this.selectedItems().length === 0) {
      alert('Preencha os dados do kit e adicione ao menos um produto.');
      return;
    }

    this.isSaving.set(true);

    const formData = new FormData();
    const formValues = this.kitForm.getRawValue();

    formData.append('name', formValues.name);
    formData.append('description', formValues.description);
    formData.append('price', formValues.price.toString());
    formData.append('is_active', formValues.is_active.toString());
    
    // Transformando a composição em JSON
    formData.append('items', JSON.stringify(this.selectedItems().map(i => ({
      product_id: i.product.id,
      quantity: i.qty
    }))));

    // Append de arquivos binários
    this.images().forEach((file, index) => {
      formData.append(`image_${index + 1}`, file);
    });

    this.catalogService.createPromoKit(formData).subscribe({
      next: () => {
        this.loadKits(); // Recarrega a Grid
        this.closeModal(); // Fecha o modal
        this.isSaving.set(false);
      },
      error: () => {
        alert('Erro ao salvar kit. Verifique se o backend está rodando.');
        this.isSaving.set(false);
      }
    });
  }
}