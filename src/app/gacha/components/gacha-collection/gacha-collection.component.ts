import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge, IonButton, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { diceOutline, paw, refreshOutline, sparklesOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CATALOG, getItemDef } from '../../data/catalog';
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
  petItemId: string | null = null;

  private sub?: Subscription;

  constructor(
    private gacha: GachaService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ diceOutline, sparklesOutline, refreshOutline, paw });
  }

  ngOnInit(): void {
    this.sub = this.gacha.state$.subscribe((state) => {
      this.currency = state.currency;
      this.inventory = state.inventory;
      this.petItemId = state.petItemId;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ownedFor(itemId: string) {
    return this.inventory[itemId];
  }

  hasRecipe(itemId: string): boolean {
    return !!getItemDef(itemId)?.recipe;
  }

  get petDef() {
    return this.petItemId ? getItemDef(this.petItemId) : undefined;
  }

  get petRank(): number {
    return this.petItemId ? (this.inventory[this.petItemId]?.rank ?? 0) : 0;
  }

  async onSingleTap(): Promise<void> {
    const outcome = this.gacha.pull('single');
    await this.showPullResult(outcome);
  }

  async onBulkTap(): Promise<void> {
    const outcome = this.gacha.pull('bulk5');
    await this.showPullResult(outcome);
  }

  /** Tap sobre la carta (solo funciona si ya posees el ítem): intenta mergear directo. */
  async onItemTap(itemId: string): Promise<void> {
    const owned = this.ownedFor(itemId);
    if (!owned) return;

    const outcome = this.gacha.mergeItem(itemId);
    const def = this.catalog.find((c) => c.id === itemId);
    if (outcome.success) {
      await this.showToast(`${def?.emoji ?? ''} ${def?.name ?? 'Ítem'} ahora es +${outcome.newRank}!`, 'success');
    } else {
      await this.showToast(outcome.message ?? 'No se pudo mergear este ítem.', 'medium');
    }
  }

  /**
   * Botón dedicado (🛠️): intenta craftear. Funciona sin importar si ya
   * posees el ítem o no — cada craft exitoso agrega una copia más
   * (útil si ya tienes 1 y quieres una segunda para mergear, por ejemplo).
   */
  async onCraftTap(event: Event, itemId: string): Promise<void> {
    event.stopPropagation();
    const outcome = this.gacha.craft(itemId);
    const def = this.catalog.find((c) => c.id === itemId);
    if (outcome.success) {
      await this.showToast(`¡Crafteaste ${def?.emoji ?? ''} ${def?.name ?? 'un ítem'}!`, 'success');
    } else {
      await this.showToast(outcome.message ?? 'No se pudo craftear.', 'medium');
    }
  }

  /** Botón dedicado (⭐) para fijar un ítem como mascota, sin interferir con el tap de merge. */
  onSetPet(event: Event, itemId: string): void {
    event.stopPropagation();
    this.gacha.selectPet(itemId);
  }

  async onRefreshTap(): Promise<void> {
    this.gacha.addTestCurrency(10000);
    await this.showToast('+10.000🪙 agregados', 'success');
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
