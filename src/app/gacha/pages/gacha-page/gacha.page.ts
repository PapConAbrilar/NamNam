import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { GachaCollectionComponent } from '../../components/gacha-collection/gacha-collection.component';

@Component({
  selector: 'app-gacha-page',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, GachaCollectionComponent],
  templateUrl: './gacha.page.html',
  styleUrls: ['./gacha.page.scss'],
})
export class GachaPage {
  constructor(private location: Location) {
    addIcons({ arrowBackOutline });
  }

  goBack(): void {
    this.location.back();
  }
}
