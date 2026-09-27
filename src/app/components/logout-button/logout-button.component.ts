import { Component, inject } from '@angular/core';
import { AlertController, IonButton, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

/** Botón de cierre de sesión para el toolbar. Pide confirmación y vuelve a la pantalla de login. */
@Component({
  selector: 'app-logout-button',
  template: `
    <ion-button fill="clear" aria-label="Cerrar sesión" (click)="confirmLogout()">
      <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
    </ion-button>
  `,
  imports: [IonButton, IonIcon],
})
export class LogoutButtonComponent {
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ logOutOutline });
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de tu cuenta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.navCtrl.navigateRoot('/login');
          },
        },
      ],
    });
    await alert.present();
  }
}
