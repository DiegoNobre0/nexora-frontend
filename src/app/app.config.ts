import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LucideAngularModule, LayoutDashboard, Calendar, Users, MessageSquare, MessageCircle, Settings, DollarSign, Bot, Pencil, Trash2 } from 'lucide-angular';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

  importProvidersFrom(
      LucideAngularModule.pick({ 
        LayoutDashboard, 
        Calendar, 
        Users, 
        MessageSquare,
        DollarSign,
        Bot,
        Pencil,
        Trash2
      })
    ),

  ]
  //  providers: [
  //   // Otimização de detecção de mudanças
  //   provideZoneChangeDetection({ eventCoalescing: true }),
  //   // Configuração das rotas do Nexora
  //   provideRouter(routes),
  //   // 🛡️ Registro do HttpClient com o nosso Interceptor funcional
  //   provideHttpClient(
  //     withInterceptors([authInterceptor])
  //   ),
  //   // ✨ Suporte para animações (Essencial para Angular Material/CDK)
  //   provideAnimationsAsync()
//   ]
};
