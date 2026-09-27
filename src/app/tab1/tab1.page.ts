import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { DiaryService } from '../services/diary.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { Meal } from '../models/nutrition.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonAvatar,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    LogoutButtonComponent,
  ],
})
export class Tab1Page {
  public authService = inject(AuthService);
  private diaryService = inject(DiaryService);

  loading = signal(true);
  consumedKcal = signal(0);
  targetKcal = signal(2000);
  consumedProtein = signal(0);
  targetProtein = signal(125);
  consumedCarbs = signal(0);
  targetCarbs = signal(250);
  consumedFat = signal(0);
  targetFat = signal(55);
  meals = signal<Meal[]>([]);

  ionViewWillEnter(): void {
    this.loadTodayData();
  }

  async loadTodayData(): Promise<void> {
    try {
      const summary = await this.diaryService.getTodaySummary();
      this.consumedKcal.set(summary.consumedKcal);
      this.targetKcal.set(summary.targetKcal);
      this.consumedProtein.set(summary.consumedProtein);
      this.targetProtein.set(summary.targetProtein);
      this.consumedCarbs.set(summary.consumedCarbs);
      this.targetCarbs.set(summary.targetCarbs);
      this.consumedFat.set(summary.consumedFat);
      this.targetFat.set(summary.targetFat);
      this.meals.set(summary.meals);
    } catch (err) {
      console.warn('Error cargando resumen de hoy en Tab1:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.loadTodayData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  get remainingKcal(): number {
    return Math.max(0, this.targetKcal() - this.consumedKcal());
  }

  get progressPct(): number {
    if (this.targetKcal() <= 0) return 0;
    return Math.min(100, Math.round((this.consumedKcal() / this.targetKcal()) * 100));
  }

  get proteinPct(): number {
    if (this.targetProtein() <= 0) return 0;
    return Math.min(100, Math.round((this.consumedProtein() / this.targetProtein()) * 100));
  }

  get carbsPct(): number {
    if (this.targetCarbs() <= 0) return 0;
    return Math.min(100, Math.round((this.consumedCarbs() / this.targetCarbs()) * 100));
  }

  get fatPct(): number {
    if (this.targetFat() <= 0) return 0;
    return Math.min(100, Math.round((this.consumedFat() / this.targetFat()) * 100));
  }

  getMealEmoji(type: string): string {
    switch (type) {
      case 'breakfast': return '☕';
      case 'lunch': return '🥗';
      case 'dinner': return '🍲';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  }

  getMealLabel(type: string): string {
    switch (type) {
      case 'breakfast': return 'Desayuno';
      case 'lunch': return 'Almuerzo';
      case 'dinner': return 'Cena';
      case 'snack': return 'Snack';
      default: return 'Comida';
    }
  }
}
