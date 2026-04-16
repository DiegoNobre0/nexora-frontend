import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router'; // 👈 Importe o Router
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isCollapsed = input(false);
  isMobileOpen = input(false);
  onCloseMobile = output<void>();

  authService = inject(AuthService);
  router = inject(Router); // 👈 Injetando o Router

  // 👈 Novo estado para o submenu
  isCatalogOpen = signal(false); 

  closeMobile() {
    this.onCloseMobile.emit();
  }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || 'U';
    return name.charAt(0).toUpperCase();
  }

  // 👈 Funções de controle do submenu
  isCatalogRoute(): boolean {
    return this.router.url.includes('/catalog');
  }

  toggleCatalog() {
    if (this.isCollapsed()) {
      // Se a sidebar estiver fechada, apenas navega para os produtos
      this.router.navigate(['/catalog/products']);
    } else {
      // Se estiver aberta, funciona como uma sanfona (abre/fecha o submenu)
      this.isCatalogOpen.update(val => !val);
    }
  }
}