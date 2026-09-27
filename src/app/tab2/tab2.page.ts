import { Component, inject, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonAvatar, IonButton, IonSpinner,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { DiaryService } from '../services/diary.service';
import { DiaryDay, MealType } from '../models/nutrition.model';
import { formatMonthYear, formatTime } from '../utils/date.utils';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonAvatar, IonButton, IonSpinner,
    IonRefresher, IonRefresherContent, LogoutButtonComponent,
  ],
})
export class Tab2Page {
  authService = inject(AuthService);
  private diaryService = inject(DiaryService);

  days = signal<DiaryDay[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  monthLabel = formatMonthYear(new Date());
  formatTime = formatTime;

  readonly mealLabel: Record<MealType, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snack',
  };

  ionViewWillEnter(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(this.days().length === 0);
    this.error.set(null);
    try {
      this.days.set(await this.diaryService.getDiary());
    } catch (err) {
      console.error('Error al cargar el diario', err);
      this.error.set('No pudimos cargar tu diario. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  progressPct(consumed: number, target: number): number {
    return target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  }
}
