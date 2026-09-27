import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonAvatar, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonFab, IonFabButton, IonIcon } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { AuthService } from '../services/auth.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonAvatar, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonFab, IonFabButton, IonIcon, ExploreContainerComponent, LogoutButtonComponent],
})
export class Tab1Page {
  constructor(public authService: AuthService) {
    addIcons({add});
  }
}
