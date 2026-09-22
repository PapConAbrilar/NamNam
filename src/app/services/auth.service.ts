import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'namnam_local_users';
  private readonly SESSION_STORAGE_KEY = 'namnam_current_user';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {
    this.initDefaultUsers();
    this.loadActiveSession();
  }

  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  private initDefaultUsers(): void {
    const existing = localStorage.getItem(this.USERS_STORAGE_KEY);
    if (!existing) {
      // Usuario de prueba predeterminado para facilitar pruebas inmediatas
      const defaultUsers: Array<UserProfile & { password?: string }> = [
        {
          id: 'user-demo-1',
          name: 'Carlos Demo',
          email: 'demo@namnam.com',
          password: 'password123',
          createdAt: new Date().toISOString(),
          hasCompletedOnboarding: true,
        },
      ];
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  }

  private loadActiveSession(): void {
    const saved = localStorage.getItem(this.SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved) as UserProfile;
        this.currentUserSubject.next(user);
      } catch {
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
      }
    }
  }

  async login(credentials: { email: string; password?: string }): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password ?? '';

    if (!email || !password) {
      return { success: false, message: 'Por favor ingresa tu correo y contraseña.' };
    }

    const users = this.getLocalUsers();
    const found = users.find((u) => u.email.toLowerCase() === email && u.password === password);

    if (!found) {
      return { success: false, message: 'Correo o contraseña incorrectos.' };
    }

    const { password: _, ...profile } = found;
    this.setSession(profile);
    return { success: true, user: profile };
  }

  async register(data: { name: string; email: string; password?: string }): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password ?? '';

    if (!name || !email || !password) {
      return { success: false, message: 'Por favor completa todos los campos requeridos.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const users = this.getLocalUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, message: 'Ya existe una cuenta con este correo electrónico.' };
    }

    const newUser: UserProfile & { password?: string } = {
      id: 'user_' + Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
      hasCompletedOnboarding: false,
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));

    const { password: _, ...profile } = newUser;
    this.setSession(profile);
    return { success: true, user: profile };
  }

  async loginWithGoogle(): Promise<{ success: boolean; user: UserProfile }> {
    // Simulación de OAuth de Google en entorno local
    const profile: UserProfile = {
      id: 'google_' + Date.now(),
      name: 'Usuario Google',
      email: 'usuario.google@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      createdAt: new Date().toISOString(),
      hasCompletedOnboarding: true,
    };

    const users = this.getLocalUsers();
    if (!users.some((u) => u.email === profile.email)) {
      users.push(profile);
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    }

    this.setSession(profile);
    return { success: true, user: profile };
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  private setSession(user: UserProfile): void {
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getLocalUsers(): Array<UserProfile & { password?: string }> {
    try {
      const data = localStorage.getItem(this.USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

