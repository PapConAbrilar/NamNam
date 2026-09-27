import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonAvatar, IonButton, IonSpinner,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { CollectionService } from '../services/collection.service';
import { CollectionItem, RARITY_LABELS, RewardStatus } from '../models/collection.model';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonAvatar, IonButton, IonSpinner,
    IonRefresher, IonRefresherContent, LogoutButtonComponent,
  ],
})
export class Tab5Page {
  authService = inject(AuthService);
  private collectionService = inject(CollectionService);
  private alertCtrl = inject(AlertController);

  items = signal<CollectionItem[]>([]);
  reward = signal<RewardStatus | null>(null);
  loading = signal(true);
  opening = signal(false);
  error = signal<string | null>(null);

  unlockedCount = computed(() => this.items().filter((i) => i.unlocked).length);
  readonly rarityLabels = RARITY_LABELS;

  ionViewWillEnter(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(this.items().length === 0);
    this.error.set(null);
    try {
      const [items, reward] = await Promise.all([
        this.collectionService.getCollection(),
        this.collectionService.getRewardStatus(),
      ]);
      this.items.set(items);
      this.reward.set(reward);
    } catch (err) {
      console.error('Error al cargar la colección', err);
      this.error.set('No pudimos cargar tu colección. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  async openReward(weekStart: string): Promise<void> {
    this.opening.set(true);
    try {
      const prize = await this.collectionService.openWeeklyReward(weekStart);
      await this.load();
      const alert = await this.alertCtrl.create({
        header: `${prize.emoji} ¡${prize.name}!`,
        subHeader: RARITY_LABELS[prize.rarity],
        message: 'Nuevo coleccionable agregado a tu álbum.',
        buttons: ['¡Genial!'],
      });
      await alert.present();
    } catch (err) {
      console.error('Error al abrir la recompensa', err);
      const alert = await this.alertCtrl.create({
        header: 'No se pudo abrir',
        message: err instanceof Error ? err.message : 'Inténtalo nuevamente más tarde.',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.opening.set(false);
    }
  }
}
