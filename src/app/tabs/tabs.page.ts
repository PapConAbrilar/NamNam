import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonAvatar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { home, camera, person, time, layers, analytics } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonAvatar],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(public authService: AuthService) {
    addIcons({ home, camera, person, time, layers, analytics });
  }
}
