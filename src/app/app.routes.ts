import { Routes } from '@angular/router';

// ... (seus imports anteriores)
import { Dashboard } from './pages/dashboard/dashboard';
import { Agenda } from './pages/agenda/agenda';
import { Whatsapp } from './pages/whatsapp/whatsapp';
import { Settings } from './pages/settings/settings';
import { MainLayout } from './components/main-layout/main-layout';
import { Clientes } from './pages/clientes/clientes';
import { authGuard } from './guards/auth-guard';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';

import { CategoriesComponent} from './pages/catalog/categories/categories';
import { KitsComponent} from './pages/catalog/kits/kits';
import { ProductsComponent } from './pages/catalog/products/products';

// 🔥 NOVOS IMPORTS DA FASE 3/4 🔥
import { KanbanComponent } from './pages/orders/kanban/kanban';
import { OrderDetailComponent } from './pages/orders/detail/detail';
import { PdvComponent } from './pages/orders/pdv/pdv';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'whatsapp', component: Whatsapp },
      { path: 'settings', component: Settings },
      { path: 'clientes', component: Clientes },
      
      // Catálogo
      { path: 'catalog', redirectTo: 'catalog/products', pathMatch: 'full' },
      { path: 'catalog/categories', component: CategoriesComponent },
      { path: 'catalog/products', component: ProductsComponent },
      { path: 'catalog/kits', component: KitsComponent },

      // 🔥 NOVAS ROTAS (Substituíndo o antigo "Orders") 🔥
      { path: 'orders/kanban', component: KanbanComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'pdv', component: PdvComponent }, 
    ]
  },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: '**', redirectTo: '' }
];