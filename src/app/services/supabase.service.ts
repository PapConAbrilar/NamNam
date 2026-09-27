import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export function isSupabaseConfigured(): boolean {
  return !!environment.supabase?.url && !!environment.supabase?.anonKey;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private clientInstance: SupabaseClient | null = null;

  /** Cliente único de Supabase. Lanza error si faltan las credenciales en `environment.ts`. */
  get client(): SupabaseClient {
    if (!this.clientInstance) {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado. Completa `supabase.url` y `supabase.anonKey` en environment.ts.');
      }
      this.clientInstance = createClient(environment.supabase.url, environment.supabase.anonKey);
    }
    return this.clientInstance;
  }
}
