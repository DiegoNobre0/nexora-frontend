import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
// Importe um serviço de Toast/Snackbar aqui depois (ex: MatSnackBar)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clona a requisição e injeta o header de autorização se o token existir
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Passa a requisição para frente e captura erros
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Token expirou ou é inválido
      if (error.status === 401) {
        authService.logout();
      }
      
      // Assinatura bloqueada (Nosso middleware Leão de Chácara do Fastify)
      if (error.status === 403 && error.error?.error === 'SubscriptionLocked') {
        // Redirecionar para a tela de cobrança
        console.warn('Assinatura Bloqueada! Redirecionando...');
        router.navigate(['/settings/billing']);
      }

      return throwError(() => error);
    })
  );
};