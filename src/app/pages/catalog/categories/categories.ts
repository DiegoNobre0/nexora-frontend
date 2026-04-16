import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  _count?: {
    products: number;
  };
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit { // Adicionado 'Component' ao nome por padronização
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);

  // Estados reativos (Signals)
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isModalOpen = signal(false);
  isEditing = signal(false);
  currentId = signal<string | null>(null);
  isSaving = signal(false); // 🔥 CORREÇÃO: Transformado em Signal booleano

  // Formulário Reativo
  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    is_active: [true]
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    
    this.catalogService.getCategories().subscribe({
      next: (res: any) => {        
        this.categories.set(res.data || []); 
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar categorias:', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🔥 CORREÇÃO: Função finalizada com "Optimistic UI Update"
  toggleCategory(id: string) {
    const category = this.categories().find(cat => cat.id === id);
    if (!category) return;

    const newStatus = !category.is_active;

    // Chama o backend
    this.catalogService.updateCategory(id, { is_active: newStatus }).subscribe({
      next: () => {
        // Atualiza apenas o item no Signal local (Evita recarregar a tela inteira atoa)
        this.categories.update(cats => 
          cats.map(c => c.id === id ? { ...c, is_active: newStatus } : c)
        );
      },
      error: (err) => {
        console.error('Erro ao alternar status', err);
        alert('Não foi possível atualizar o status da categoria.');
      }
    });
  }

  openModal(category?: Category) {
    if (category) {
      this.isEditing.set(true);
      this.currentId.set(category.id);
      this.categoryForm.patchValue({
        name: category.name,
        is_active: category.is_active
      });
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.categoryForm.reset({ is_active: true });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.categoryForm.reset(); // Limpa o formulário ao fechar
  }

  // 🔥 CORREÇÃO: Controle de Loading no botão (DRY Principle)
  onSubmit() {
    if (this.categoryForm.invalid || this.isSaving()) return;

    this.isSaving.set(true); // Trava o botão e gira o ícone
    const data = this.categoryForm.getRawValue();

    // Decide se é Criação ou Atualização para não repetir o código de 'subscribe'
    const request$ = this.isEditing()
      ? this.catalogService.updateCategory(this.currentId()!, data)
      : this.catalogService.createCategory(data);

    request$.subscribe({
      next: () => {
        this.loadCategories();
        this.closeModal();
        this.isSaving.set(false); // Destrava
      },
      error: (err) => {
        console.error('Erro ao salvar categoria:', err);
        alert('Erro ao salvar os dados.');
        this.isSaving.set(false); // Destrava em caso de erro
      }
    });
  }

  deleteCategory(id: string) {
    if (confirm('Deseja realmente excluir esta categoria? Os produtos vinculados ficarão sem categoria.')) {
      this.catalogService.deleteCategory(id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => {
          console.error('Erro ao deletar:', err);
          alert('Não é possível deletar esta categoria pois existem produtos vinculados a ela.');
        }
      });
    }
  }
}