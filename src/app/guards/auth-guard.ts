// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Como está estático, vamos fingir que tem um token
  const isAuthenticated = !!localStorage.getItem('nexora_token');

  if (isAuthenticated) {
    return true;
  } else {
    // Se não estiver logado, manda pro login (vamos criar essa rota depois)
    router.navigate(['/login']);
    return false;
  }
};