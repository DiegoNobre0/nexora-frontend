import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const planGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Pegamos a feature necessária direto do 'data' da rota
  const requiredFeature = route.data['feature']; 
  const tokenPayload : any = authService.getDecodedToken();

  // Verifica se o usuário tem a feature no token JWT
  // Assumindo que plan_features seja um array (ex: ['bot_ai', 'pos_system']) ou um objeto booleano
  if (tokenPayload?.plan_features?.includes(requiredFeature)) {
    return true;
  }

  // Se não tiver o plano, redireciona para a tela de upgrade/faturamento
  console.warn(`Acesso negado: Plano não possui a feature ${requiredFeature}`);
  router.navigate(['/settings']); 
  return false;
};