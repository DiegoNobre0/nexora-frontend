import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';

import {
  LucideAngularModule, LayoutDashboard, Calendar, Users, MessageSquare,
  MessageCircle, Settings, DollarSign, Bot, Pencil, Trash2, ChevronLeft, 
  ChevronRight, Plus, Circle, Search, Menu, Moon, Mail, Bell, ArrowLeft, 
  Clock, TrendingUp, MoreVertical, ChevronDown, RefreshCw, Eye, EyeOff
} from 'lucide-angular';

// Registra os dados de localidade para o Brasil
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    // ⚙️ Otimização de detecção de mudanças do Angular 18+
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // 🛣️ Configuração das rotas do Nexora
    provideRouter(routes),

    // 🇧🇷 Configuração de localidade para R$ e Datas no padrão BR
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    // 🛡️ Registro do HttpClient com o nosso Interceptor funcional (Essencial para o Cadastro/Login)
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // ✨ Suporte para animações (Essencial para Angular Material/CDK e transições suaves)
    provideAnimationsAsync(),

    // 🎨 Registro global dos ícones (incluindo o Eye e EyeOff da senha)
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard, Calendar, Users, MessageSquare, DollarSign, Bot,
        Pencil, Trash2, ChevronLeft, ChevronRight, Plus, MessageCircle,
        Settings, Circle, Menu, Search, Moon, Mail, Bell, ArrowLeft,
        TrendingUp, Clock, MoreVertical, ChevronDown, RefreshCw, Eye, EyeOff
      })
    )
  ]
};