import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserProfile, UserMetrics } from '../models/user.model';
import { SupabaseService, isSupabaseConfigured } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'namnam_local_users';
  private readonly SESSION_STORAGE_KEY = 'namnam_current_user';

  private supabaseService = inject(SupabaseService);

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  private isSessionLoadedSubject = new BehaviorSubject<boolean>(false);
  public isSessionLoaded$ = this.isSessionLoadedSubject.asObservable();

  constructor() {
    this.initDefaultUsers();
    this.initSession();
  }

  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  get isLoadingSession(): boolean {
    return !this.isSessionLoadedSubject.value;
  }

  /** Permite que los Route Guards esperen la resolución de sesión al arrancar la app */
  async waitForSession(): Promise<UserProfile | null> {
    if (this.isSessionLoadedSubject.value) {
      return this.currentUser;
    }
    await firstValueFrom(this.isSessionLoaded$.pipe(filter((loaded) => loaded)));
    return this.currentUser;
  }

  private async initSession(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const client = this.supabaseService.client;
        const { data: { session } } = await client.auth.getSession();

        if (session?.user) {
          const profile = await this.fetchSupabaseProfile(session.user.id, session.user.email);
          this.currentUserSubject.next(profile);
          this.setSession(profile);
        } else {
          this.loadLocalActiveSession();
        }

        // Escucha cambios de sesión en Supabase (ej: login externo o token refrescado)
        client.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            const profile = await this.fetchSupabaseProfile(session.user.id, session.user.email);
            this.setSession(profile);
          } else if (event === 'SIGNED_OUT') {
            this.currentUserSubject.next(null);
            localStorage.removeItem(this.SESSION_STORAGE_KEY);
          }
        });
      } catch (err) {
        console.warn('Error inicializando sesión de Supabase. Usando local:', err);
        this.loadLocalActiveSession();
      } finally {
        this.isSessionLoadedSubject.next(true);
      }
    } else {
      this.loadLocalActiveSession();
      this.isSessionLoadedSubject.next(true);
    }
  }

  private async fetchSupabaseProfile(userId: string, email?: string): Promise<UserProfile> {
    try {
      const client = this.supabaseService.client;
      const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        return {
          id: profile.id,
          name: profile.name || email?.split('@')[0] || 'Usuario',
          email: email || '',
          avatarUrl: profile.avatar_url,
          createdAt: profile.created_at,
          hasCompletedOnboarding: !!profile.has_completed_onboarding,
          metrics: profile.has_completed_onboarding
            ? {
                weightKg: Number(profile.weight_kg) || 70,
                heightCm: Number(profile.height_cm) || 175,
                age: Number(profile.age) || 25,
                gender: profile.gender,
                activityLevel: profile.activity_level,
                goal: profile.goal,
                targetCalories: 2000,
              }
            : undefined,
        };
      }
    } catch (err) {
      console.warn('Error leyendo perfil de Supabase:', err);
    }

    return {
      id: userId,
      name: email?.split('@')[0] || 'Usuario',
      email: email || '',
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
    };
  }

  private initDefaultUsers(): void {
    const existing = localStorage.getItem(this.USERS_STORAGE_KEY);
    if (!existing) {
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

  private loadLocalActiveSession(): void {
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

    if (isSupabaseConfigured()) {
      try {
        const client = this.supabaseService.client;
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          // Si el usuario existe en local (ej. usuario demo), probamos local como alternativa
          const localResult = this.loginLocal(email, password);
          if (localResult.success) return localResult;
          return { success: false, message: error.message };
        }
        if (data.user) {
          const profile = await this.fetchSupabaseProfile(data.user.id, data.user.email);
          this.setSession(profile);
          return { success: true, user: profile };
        }
      } catch (err: any) {
        console.warn('Error en login Supabase, probando local:', err);
      }
    }

    return this.loginLocal(email, password);
  }

  private loginLocal(email: string, password: string): { success: boolean; message?: string; user?: UserProfile } {
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

    if (isSupabaseConfigured()) {
      try {
        const client = this.supabaseService.client;
        const { data: authData, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) {
          return { success: false, message: error.message };
        }
        if (authData.user) {
          const profile: UserProfile = {
            id: authData.user.id,
            name,
            email,
            hasCompletedOnboarding: false,
            createdAt: new Date().toISOString(),
          };
          this.setSession(profile);
          return { success: true, user: profile };
        }
      } catch (err: any) {
        console.warn('Error en registro Supabase, probando local:', err);
      }
    }

    return this.registerLocal(name, email, password);
  }

  private registerLocal(name: string, email: string, password: string): { success: boolean; message?: string; user?: UserProfile } {
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

  async completeOnboarding(metrics: UserMetrics): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const active = this.currentUser;
    if (!active) {
      return { success: false, message: 'No hay una sesión activa para completar el perfil.' };
    }

    const updatedProfile: UserProfile = {
      ...active,
      hasCompletedOnboarding: true,
      metrics,
    };

    if (isSupabaseConfigured()) {
      try {
        const client = this.supabaseService.client;
        await client
          .from('profiles')
          .update({
            has_completed_onboarding: true,
            weight_kg: metrics.weightKg,
            height_cm: metrics.heightCm,
            age: metrics.age,
            gender: metrics.gender,
            activity_level: metrics.activityLevel,
            goal: metrics.goal,
          })
          .eq('id', active.id);

        // Inserta la primera fila en nutrition_goals para fijar las calorías diarias
        await client
          .from('nutrition_goals')
          .upsert({
            user_id: active.id,
            target_kcal: metrics.targetCalories || 2000,
            protein_g: metrics.targetProteinGrams || 125,
            carbs_g: metrics.targetCarbsGrams || 250,
            fat_g: metrics.targetFatGrams || 55,
            water_ml: 2500,
            valid_from: new Date().toISOString().split('T')[0],
          });
      } catch (err) {
        console.warn('Error guardando onboarding en Supabase:', err);
      }
    }

    // Actualiza en el listado general de usuarios locales
    const users = this.getLocalUsers();
    const index = users.findIndex((u) => u.id === active.id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        hasCompletedOnboarding: true,
        metrics,
      };
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    }

    this.setSession(updatedProfile);
    return { success: true, user: updatedProfile };
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await this.supabaseService.client.auth.signOut();
      } catch (err) {
        console.warn('Error cerrando sesión en Supabase:', err);
      }
    }
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
