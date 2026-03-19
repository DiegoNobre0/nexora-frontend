import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule,LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  // private router = inject(Router);
  isLoading = false;

  loginForm = this.formBuilder.group({
    email: ['diego@nexora.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]]
  });

onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } : any = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (res) => {
          // Token e Usuário já foram salvos no LocalStorage pelo AuthService
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.error || 'Credenciais inválidas.');
        }
      });
    }
  }
}