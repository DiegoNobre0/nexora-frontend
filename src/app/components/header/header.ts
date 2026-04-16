import { Component, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  toggleMenu = output<void>();
  authService = inject(AuthService);

  isNotifOpen = signal(false);
  isMessagesOpen = signal(false);
  
  // Controle de Frente de Caixa (Pode vir de um OrderService no futuro)
  isPosOpen = signal(true); 

  toggleNotif() {
    this.isNotifOpen.set(!this.isNotifOpen());
    this.isMessagesOpen.set(false);
  }

  toggleMessages() {
    this.isMessagesOpen.set(!this.isMessagesOpen());
    this.isNotifOpen.set(false);
  }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || 'U';
    return name.charAt(0).toUpperCase();
  }
}