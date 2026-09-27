import { Component, inject, signal } from '@angular/core';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonAvatar, IonButton, IonSpinner,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { ProgressService } from '../services/progress.service';
import { MacroProgress, WeeklyProgress } from '../models/nutrition.model';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonAvatar, IonButton, IonSpinner,
    IonRefresher, IonRefresherContent, LogoutButtonComponent,
  ],
})
export class Tab4Page {
  authService = inject(AuthService);
  private progressService = inject(ProgressService);

  progress = signal<WeeklyProgress | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ionViewWillEnter(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(this.progress() === null);
    this.error.set(null);
    try {
      this.progress.set(await this.progressService.getWeeklyProgress());
    } catch (err) {
      console.error('Error al cargar el progreso semanal', err);
      this.error.set('No pudimos cargar tu progreso. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  macroPct(macro: MacroProgress): number {
    return macro.targetG > 0 ? Math.min(100, (macro.consumedG / macro.targetG) * 100) : 0;
  }

  weightDeltaLabel(delta: number | null): string {
    if (delta === null) return 'sin registro previo';
    if (delta === 0) return 'sin cambios esta sem.';
    return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} kg esta sem.`;
  }
}
