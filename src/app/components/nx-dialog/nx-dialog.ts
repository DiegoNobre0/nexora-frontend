import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export type DialogType = 'confirm' | 'danger' | 'success' | 'error' | 'warning';

@Component({
  selector: 'nx-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  styleUrl: './nx-dialog.scss', // 👈 ISTO É MUITO IMPORTANTE
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        
        <div class="confirm-modal-content">
          <div class="confirm-modal-icon" [ngClass]="'confirm-modal-icon--' + type">
            <lucide-icon [name]="getIcon()"></lucide-icon>
          </div>
          
          <h2 class="confirm-modal-title">{{ title }}</h2>
          <p class="confirm-modal-desc" [innerHTML]="message"></p>
        </div>

        <div class="modal-actions">
          <button type="button" (click)="onCancel()" class="btn-cancel" [disabled]="isLoading">
            {{ cancelLabel }}
          </button>
          
          <button type="button" 
                  (click)="onConfirm()" 
                  class="btn-primary" 
                  [ngClass]="{'btn-primary--danger': type === 'danger' || type === 'error'}"
                  [disabled]="isLoading">
            @if (isLoading) {
              <lucide-icon name="refresh-cw" class="btn-icon btn-icon--spin"></lucide-icon>
              Processando...
            } @else {
              <lucide-icon [name]="confirmIcon" class="btn-icon"></lucide-icon>
              {{ confirmLabel }}
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class NxDialogComponent {
  @Input() type: DialogType = 'confirm';
  @Input() title: string = 'Confirmação';
  @Input() message: string = 'Deseja prosseguir com esta ação?';
  @Input() confirmLabel: string = 'Confirmar';
  @Input() cancelLabel: string = 'Cancelar';
  @Input() confirmIcon: string = 'check';
  @Input() isLoading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() { this.confirm.emit(); }
  onCancel() { this.cancel.emit(); }

  getIcon(): string {
    switch (this.type) {
      case 'danger': return 'trash-2';
      case 'error': return 'x-circle';
      case 'success': return 'check-circle';
      case 'warning': return 'alert-triangle';
      default: return 'help-circle';
    }
  }
}