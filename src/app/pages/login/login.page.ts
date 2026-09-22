import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonIcon,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoGoogle, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonIcon,
  ],
})
export class LoginPage {
  currentSegment: 'login' | 'register' = 'login';
  name = '';
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) {
    addIcons({ logoGoogle, mailOutline, lockClosedOutline, personOutline });
  }

  onSegmentChange() {
    this.name = '';
    this.password = '';
  }

  async onSubmit() {
    if (this.isLoading) return;

    const loading = await this.loadingCtrl.create({
      message: this.currentSegment === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...',
      spinner: 'crescent',
    });
    await loading.present();
    this.isLoading = true;

    try {
      if (this.currentSegment === 'login') {
        const res = await this.authService.login({ email: this.email, password: this.password });
        await loading.dismiss();
        this.isLoading = false;

        if (res.success && res.user) {
          await this.showToast(`¡Hola de nuevo, ${res.user.name}! 🥑`, 'success');
          this.router.navigate(['/tabs']);
        } else {
          await this.showToast(res.message || 'Error al iniciar sesión', 'danger');
        }
      } else {
        const res = await this.authService.register({ name: this.name, email: this.email, password: this.password });
        await loading.dismiss();
        this.isLoading = false;

        if (res.success && res.user) {
          await this.showToast(`¡Cuenta creada con éxito, ${res.user.name}! 🚀`, 'success');
          this.router.navigate(['/tabs']);
        } else {
          await this.showToast(res.message || 'Error al registrar usuario', 'danger');
        }
      }
    } catch {
      await loading.dismiss();
      this.isLoading = false;
      await this.showToast('Ocurrió un error inesperado. Inténtalo de nuevo.', 'danger');
    }
  }

  async onGoogleLogin() {
    if (this.isLoading) return;

    const loading = await this.loadingCtrl.create({
      message: 'Conectando con Google...',
      spinner: 'crescent',
    });
    await loading.present();
    this.isLoading = true;

    try {
      const res = await this.authService.loginWithGoogle();
      await loading.dismiss();
      this.isLoading = false;

      if (res.success) {
        await this.showToast(`¡Bienvenido, ${res.user.name}! 🥑`, 'success');
        this.router.navigate(['/tabs']);
      }
    } catch {
      await loading.dismiss();
      this.isLoading = false;
      await this.showToast('No se pudo iniciar sesión con Google.', 'danger');
    }
  }

  async onForgotPassword() {
    await this.showToast('Te enviaremos un enlace de recuperación si la cuenta existe.', 'medium');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
    });
    await toast.present();
  }
}

