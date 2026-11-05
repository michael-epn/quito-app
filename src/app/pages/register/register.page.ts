import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, eyeOffOutline, eyeOutline, personAddOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonSpinner,
    IonTitle,
    IonToast,
    IonToolbar,
  ],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly form = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );
  readonly passwordVisible = signal(false);
  readonly confirmationVisible = signal(false);
  readonly loading = signal(false);
  readonly toastMessage = signal('');
  readonly toastOpen = signal(false);

  constructor() {
    addIcons({ checkmarkCircleOutline, eyeOffOutline, eyeOutline, personAddOutline });
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.register(email.trim(), password);
      const toast = await this.toastController.create({
        message: '¡Cuenta creada! Te damos la bienvenida a Quito Incidencias.',
        color: 'success',
        duration: 2500,
        position: 'top',
      });
      await toast.present();
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } catch (error) {
      this.toastMessage.set(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
      this.toastOpen.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  toggleConfirmationVisibility(): void {
    this.confirmationVisible.update((visible) => !visible);
  }
}
