import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Product } from '../../../interfaces/catalog.interface';

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
        console.log('Kits carregados:', this.kits());
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
    console.log('Items do kit:', JSON.stringify(kit.items, null, 2))
    this.isEditing.set(true);
    this.currentKitId.set(kit.id);

    // 1. Preenche o formulário de textos
    this.kitForm.patchValue({
      name: kit.name,
      description: kit.description,
      price: kit.price,
      is_active: kit.is_active
    });

    // 2. Preenche a composição do kit
    // Como o backend já envia o include do "product", fica fácil mapear pro formato da UI
    const itemsToEdit = kit.items.map((i: any) => ({
      product: i.product, // O backend já manda id, name, price, cost_price
      qty: i.quantity
    }));
    this.selectedItems.set(itemsToEdit);

    // 3. Preenche as imagens existentes
    const urls = [kit.image_url_1, kit.image_url_2, kit.image_url_3, kit.image_url_4].filter(Boolean);
    this.previews.set(urls);
    this.images.set([]); // O array de Arquivos novos (Files) começa vazio, pois as que estão lá são URLs

    // Abre o Modal
    this.isModalOpen.set(true);
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
    
    if (formValues.description) {
      formData.append('description', formValues.description);
    }
    
    // O price pode vir como string do input HTML, garantimos que não vá "undefined"
    formData.append('price', (formValues.price || 0).toString());
    formData.append('is_active', formValues.is_active.toString());
    
    // Transformando a composição em JSON
    formData.append('items', JSON.stringify(this.selectedItems().map(i => ({
      product_id: i.product.id,
      quantity: i.qty
    }))));

    // Append de arquivos binários (Apenas as novas imagens que o usuário escolheu)
    this.images().forEach((file, index) => {
      formData.append(`image_${index + 1}`, file);
    });

    // ────────────────────────────────────────────────────────
    // Roteamento: É uma Edição ou uma Criação?
    // ────────────────────────────────────────────────────────
    if (this.isEditing() && this.currentKitId()) {
      // 🔵 FLUXO DE ATUALIZAÇÃO (PUT)
      this.catalogService.updatePromoKit(this.currentKitId()!, formData).subscribe({
        next: () => {
          this.loadKits(); // Recarrega a Grid com os dados novos
          this.closeModal(); // Fecha o modal e limpa tudo
          this.isSaving.set(false);
        },
        error: (err : any) => {
          console.error(err);
          alert('Erro ao atualizar kit. Verifique o console.');
          this.isSaving.set(false);
        }
      });

    } else {
      // 🟢 FLUXO DE CRIAÇÃO (POST)
      console.log([...formData.entries()]) // Debug para verificar o conteúdo do FormData antes de enviar
      this.catalogService.createPromoKit(formData).subscribe({
        next: () => {
          this.loadKits(); // Recarrega a Grid
          this.closeModal(); // Fecha o modal e limpa tudo
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao salvar kit. Verifique se o backend está rodando.');
          this.isSaving.set(false);
        }
      });
    }
  }
}