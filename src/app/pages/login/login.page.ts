import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, logInOutline, locateOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  readonly passwordVisible = signal(false);
  readonly loading = signal(false);
  readonly toastMessage = signal('');
  readonly toastOpen = signal(false);

  constructor() {
    addIcons({ eyeOffOutline, eyeOutline, logInOutline, locateOutline });
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.login(email.trim(), password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/inicio';
      await this.router.navigateByUrl(destination, { replaceUrl: true });
    } catch (error) {
      this.mostrarError(error);
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private mostrarError(error: unknown): void {
    this.toastMessage.set(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    this.toastOpen.set(true);
  }
}
