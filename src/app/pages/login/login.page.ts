import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoGoogle, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';

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
    IonList,
    IonItem,
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

  constructor(private router: Router) {
    addIcons({ logoGoogle, mailOutline, lockClosedOutline, personOutline });
  }

  onSegmentChange() {
    this.name = '';
    this.password = '';
  }

  onSubmit() {
    // Por ahora navega al flujo de tabs
    this.router.navigate(['/tabs']);
  }

  onGoogleLogin() {
    this.router.navigate(['/tabs']);
  }

  onForgotPassword() {
    console.log('Recuperar contraseña solicitado');
  }
}

