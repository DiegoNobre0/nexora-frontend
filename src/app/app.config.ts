import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import {
  LucideAngularModule, LayoutDashboard,
  Calendar, Users, MessageSquare,
  MessageCircle, Settings, DollarSign,
  Bot, Pencil, Trash2, ChevronLeft, ChevronRight, Plus,
  Circle,
  Search,
  Menu,
  Moon,
  Mail,
  Bell,
  ArrowLeft,
  Clock,
  TrendingUp,
  MoreVertical,
  ChevronDown,
  RefreshCw
} from 'lucide-angular';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    { provide: LOCALE_ID, useValue: 'pt-BR' },

    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard,
        Calendar,
        Users,
        MessageSquare,
        DollarSign,
        Bot,
        Pencil,
        Trash2,
        ChevronLeft,
        ChevronRight,
        Plus,
        MessageCircle,
        Settings,
        Circle,
        Menu,
        Search,
        Moon,
        Mail,
        Bell,
        ArrowLeft,
        TrendingUp,
        Clock,
        MoreVertical,
        ChevronDown,
        RefreshCw
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
