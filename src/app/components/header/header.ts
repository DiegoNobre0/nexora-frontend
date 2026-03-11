import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {

 


  // Evento para abrir a sidebar no celular
  toggleMenu = output<void>();

  // Controle dos dropdowns
  isNotifOpen = signal(false);
  isMessagesOpen = signal(false);

  toggleNotif() {
    this.isNotifOpen.set(!this.isNotifOpen());
    this.isMessagesOpen.set(false); // Fecha o outro
  }

  toggleMessages() {
    this.isMessagesOpen.set(!this.isMessagesOpen());
    this.isNotifOpen.set(false); // Fecha o outro
  }
}