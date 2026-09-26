import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge, IonButton, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { diceOutline, sparklesOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CATALOG } from '../../data/catalog';
import { RARITY_CONFIG, costFor } from '../../data/rarity-config';
import { Inventory } from '../../models/gacha.types';
import { GachaService, PullOutcome } from '../../services/gacha.service';

@Component({
  selector: 'app-gacha-collection',
  standalone: true,
  imports: [CommonModule, IonButton, IonBadge, IonIcon],
  templateUrl: './gacha-collection.component.html',
  styleUrls: ['./gacha-collection.component.scss'],
})
export class GachaCollectionComponent implements OnInit, OnDestroy {
  readonly catalog = CATALOG;
  readonly rarityConfig = RARITY_CONFIG;
  readonly singleCost = costFor('single');
  readonly bulkCost = costFor('bulk5');

  currency = 0;
  inventory: Inventory = {};

  private sub?: Subscription;

  constructor(
    private gacha: GachaService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ diceOutline, sparklesOutline });
  }

  ngOnInit(): void {
    this.sub = this.gacha.state$.subscribe((state) => {
      this.currency = state.currency;
      this.inventory = state.inventory;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ownedFor(itemId: string) {
    return this.inventory[itemId];
  }

  async onSingleTap(): Promise<void> {
    const outcome = this.gacha.pull('single');
    await this.showPullResult(outcome);
  }

  async onBulkTap(): Promise<void> {
    const outcome = this.gacha.pull('bulk5');
    await this.showPullResult(outcome);
  }

  /** Tap sobre un ítem desbloqueado: intenta mergear directo (sin confirmación, sin animación). */
  async onItemTap(itemId: string): Promise<void> {
    const owned = this.ownedFor(itemId);
    if (!owned) return;

    const outcome = this.gacha.mergeItem(itemId);
    if (outcome.success) {
      const def = this.catalog.find((c) => c.id === itemId);
      await this.showToast(`${def?.emoji ?? ''} ${def?.name ?? 'Ítem'} ahora es +${outcome.newRank}!`, 'success');
    } else {
      await this.showToast(outcome.message ?? 'No se pudo mergear este ítem.', 'medium');
    }
  }

  private async showPullResult(outcome: PullOutcome): Promise<void> {
    if (!outcome.success || !outcome.results) {
      await this.showToast(outcome.message ?? 'No se pudo completar la tirada.', 'danger');
      return;
    }
    const summary = outcome.results.map((item) => `${item.emoji} ${item.name}`).join(', ');
    await this.showToast(`¡Obtuviste: ${summary}!`, 'success');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
