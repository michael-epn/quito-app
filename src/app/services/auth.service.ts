import { Injectable, signal } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);

  private readonly auth: Auth;
  private readonly authReady: Promise<void>;

  constructor() {
    const app = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app);
    this.authReady = new Promise<void>((resolve, reject) => {
      let initialized = false;

      onAuthStateChanged(
        this.auth,
        (user) => {
          this.user.set(user);
          if (!initialized) {
            initialized = true;
            resolve();
          }
        },
        (error) => {
          if (!initialized) {
            initialized = true;
            reject(this.translateAuthError(error));
          }
        },
      );
    });
  }

  async waitForAuthInitialization(): Promise<User | null> {
    await this.authReady;
    return this.auth.currentUser;
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw this.translateAuthError(error);
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw this.translateAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.translateAuthError(error);
    }
  }

  private translateAuthError(error: unknown): Error {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
      'auth/user-not-found': 'No existe una cuenta con ese correo electrónico.',
      'auth/wrong-password': 'El correo o la contraseña no son correctos.',
      'auth/email-already-in-use': 'Ya existe una cuenta registrada con ese correo electrónico.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': 'No se pudo conectar. Verifica tu conexión a Internet.',
      'auth/invalid-email': 'Ingresa un correo electrónico válido.',
      'auth/too-many-requests': 'Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.',
    };

    return new Error(messages[code] ?? 'No se pudo completar la autenticación. Inténtalo de nuevo.');
  }
}
