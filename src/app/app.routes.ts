import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Agenda } from './pages/agenda/agenda';
import { Whatsapp } from './pages/whatsapp/whatsapp';
import { Settings } from './pages/settings/settings';
import { MainLayout } from './components/main-layout/main-layout';


export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      // Redireciona o caminho vazio direto para o dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      { path: 'dashboard', component: Dashboard },
      { path: 'agenda', component: Agenda },
      { path: 'whatsapp', component: Whatsapp },
      { path: 'settings', component: Settings },
    ]
  },
  // Caso queira adicionar uma página de Login depois, ela ficaria fora do children do MainLayout
  // { path: 'login', component: LoginComponent }
];