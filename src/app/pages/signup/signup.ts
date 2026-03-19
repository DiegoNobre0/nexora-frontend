import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, } from 'lucide-angular'; // 👈 Importante para o ícone de olho
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  signupForm: FormGroup;
  showPassword = false;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(
    private fb: FormBuilder
  ) {
    this.signupForm = this.fb.group({
      companyName: ['', Validators.required],
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      whatsapp: ['', [Validators.required, Validators.minLength(14)]], // Mínimo para (xx) xxxxx-xxxx
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [false, Validators.requiredTrue] // 👈 Obriga a marcar os termos
    });
  }

  // 👁️ Alterna a visibilidade da senha
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // 📱 Máscara nativa para o WhatsApp (11) 99999-9999
  applyPhoneMask(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    if (value.length > 11) value = value.substring(0, 11); // Limita a 11 dígitos

    if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Adiciona parênteses
    }
    if (value.length > 9) {
      value = value.replace(/(\d{5})(\d)/, '$1-$2'); // Adiciona o traço se for celular (9 dígitos)
    } else if (value.length > 6) {
      value = value.replace(/(\d{4})(\d)/, '$1-$2'); // Telefone fixo (8 dígitos)
    }

    event.target.value = value;
    this.signupForm.get('whatsapp')?.setValue(value, { emitEvent: false });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;

      this.authService.register(this.signupForm.value).subscribe({
        next: (response) => {
          alert('Empresa criada com sucesso! A infraestrutura do seu salão está pronta.');
          this.router.navigate(['/login']); // Redireciona para o login
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.error || 'Erro ao criar conta. Tente novamente.');
        }
      });

    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}