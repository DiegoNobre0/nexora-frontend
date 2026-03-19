import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Agenda } from './pages/agenda/agenda';
import { Whatsapp } from './pages/whatsapp/whatsapp';
import { Settings } from './pages/settings/settings';
import { MainLayout } from './components/main-layout/main-layout';
import { Clientes } from './pages/clientes/clientes';
import { authGuard } from './guards/auth-guard';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';

export const routes: Routes = [
  { 
    path: '', 
    component: MainLayout,
    canActivate: [authGuard], // 🛡️ Protegendo tudo aqui!
    children: [
      // 🔥 REDIRECIONAMENTO PRINCIPAL 🔥
      // Quando acessar a raiz do MainLayout, joga automaticamente para o dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
      
      { path: 'dashboard', component: Dashboard },
      { path: 'agenda', component: Agenda },
      { path: 'whatsapp', component: Whatsapp },
      { path: 'settings', component: Settings },
      { path: 'clientes', component: Clientes }
    ]
  },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  
  // 🛡️ ROTA CURINGA (Tratamento de 404)
  // Se o usuário digitar qualquer URL maluca, joga ele para a raiz (que vai pro dashboard)
  { path: '**', redirectTo: '' } 
];