import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, RegisterData } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  signupForm = this.fb.nonNullable.group({
    companyName: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    whatsapp: ['', [Validators.required, Validators.minLength(14)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    terms: [false, Validators.requiredTrue],
  });

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // Máscara nativa para WhatsApp: (11) 99999-9999
  applyPhoneMask(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '($1) $2');
    if (value.length > 9) value = value.replace(/(\d{5})(\d)/, '$1-$2');
    else if (value.length > 6) value = value.replace(/(\d{4})(\d)/, '$1-$2');

    input.value = value;
    this.signupForm.get('whatsapp')?.setValue(value, { emitEvent: false });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // getRawValue() garante tipagem correta mesmo com campos disabled
    this.authService.register(this.signupForm.getRawValue() as RegisterData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Erro ao criar conta. Tente novamente.'
        );
      },
    });
  }
}