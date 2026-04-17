import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../../services/catalog.service';
import { Category } from '../../../interfaces/catalog.interface';


@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);

  // ─── ESTADOS GERAIS ─────────────────────────────────────────
  categories = signal<Category[]>([]);
  isLoading = signal(true);

  // ─── MODAL DE FORMULÁRIO (CRIAR/EDITAR) ─────────────────────
  isModalOpen = signal(false);
  isEditing = signal(false);
  currentId = signal<string | null>(null);
  isSaving = signal(false);

  // ─── MODAL DE CONFIRMAÇÃO (EXCLUSÃO) ────────────────────────
  isConfirmModalOpen = signal(false);
  itemToDelete = signal<Category | null>(null);
  isDeleting = signal(false);

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

  toggleCategory(id: string) {
    const category = this.categories().find(cat => cat.id === id);
    if (!category) return;

    const newStatus = !category.is_active;

    this.catalogService.updateCategory(id, { is_active: newStatus }).subscribe({
      next: () => {
        this.categories.update(cats => 
          cats.map(c => c.id === id ? { ...c, is_active: newStatus } : c)
        );
      },
      error: (err) => {
        console.error('Erro ao alternar status', err);
        // Opcional: futuramente trocar esse alert por um Toast/Snackbar bonito
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
    this.categoryForm.reset();
  }

  onSubmit() {
    if (this.categoryForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const data = this.categoryForm.getRawValue();

    const request$ = this.isEditing()
      ? this.catalogService.updateCategory(this.currentId()!, data)
      : this.catalogService.createCategory(data);

    request$.subscribe({
      next: () => {
        this.loadCategories();
        this.closeModal();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Erro ao salvar categoria:', err);
        alert('Erro ao salvar os dados.');
        this.isSaving.set(false);
      }
    });
  }

  // ─── LÓGICA DE EXCLUSÃO (NOVO PADRÃO) ───────────────────────
  
  openDeleteConfirm(category: Category) {
    this.itemToDelete.set(category);
    this.isConfirmModalOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isConfirmModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  confirmDelete() {
    const category = this.itemToDelete();
    if (!category) return;

    this.isDeleting.set(true); // Gira o loading do botão de exclusão

    this.catalogService.deleteCategory(category.id).subscribe({
      next: () => {
        // Atualiza a interface otimista removendo o item
        this.categories.update(cats => cats.filter(c => c.id !== category.id));
        this.closeDeleteConfirm();
        this.isDeleting.set(false);
      },
      error: (err) => {
        console.error('Erro ao deletar:', err);
        alert(`Não é possível deletar a categoria "${category.name}" pois existem produtos vinculados a ela.`);
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
      }
    });
  }
}