import { Component, ElementRef, ViewChild, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonAvatar,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  ToastController,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  camera,
  images,
  refresh,
  checkmark,
  sparkles,
  trashOutline,
  restaurantOutline,
  arrowBack,
  syncOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../services/gemini.service';
import { DiaryService } from '../services/diary.service';
import { AuthService } from '../services/auth.service';
import { LogoutButtonComponent } from '../components/logout-button/logout-button.component';
import { FoodRecognitionResult } from '../models/food-recognition.model';
import { MealType } from '../models/nutrition.model';
import { toISODate } from '../utils/date.utils';
import { GachaService } from '../gacha/services/gacha.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonAvatar,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    LogoutButtonComponent,
  ],
})
export class Tab3Page {
  @ViewChild('videoPlayer') videoElementRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  public authService = inject(AuthService);
  private geminiService = inject(GeminiService);
  private diaryService = inject(DiaryService);
  private gachaService = inject(GachaService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  currentView: 'capture' | 'analyzing' | 'result' = 'capture';
  previewImage: string | null = null;
  analysisResult: FoodRecognitionResult | null = null;
  selectedMealType: MealType = 'lunch';
  isProcessing = false;

  // Manejo de cámara en vivo (web y móvil)
  mediaStream: MediaStream | null = null;
  isCameraStreaming = false;
  cameraFacingMode: 'environment' | 'user' = 'environment';
  cameraError: string | null = null;

  constructor() {
    addIcons({
      camera,
      images,
      refresh,
      checkmark,
      sparkles,
      trashOutline,
      restaurantOutline,
      arrowBack,
      syncOutline,
    });
    this.selectedMealType = this.guessMealType();
  }

  ionViewDidEnter() {
    if (this.currentView === 'capture' && !Capacitor.isNativePlatform()) {
      this.initWebCamera();
    }
  }

  ionViewWillLeave() {
    this.stopWebCamera();
  }

  /** Inicia el stream de video de la cámara real en el navegador */
  async initWebCamera() {
    this.stopWebCamera();
    this.cameraError = null;

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraError = 'La cámara no es soportada en este navegador.';
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;

      // Espera el tick para asegurar que el elemento <video> esté en el DOM
      setTimeout(() => {
        this.ngZone.run(() => {
          if (this.videoElementRef?.nativeElement) {
            this.videoElementRef.nativeElement.srcObject = stream;
            this.videoElementRef.nativeElement.play().catch(() => {});
            this.isCameraStreaming = true;
            this.cdr.detectChanges();
          }
        });
      }, 50);
    } catch (err: any) {
      console.warn('Error accediendo a la cámara web en vivo:', err);
      this.ngZone.run(() => {
        this.isCameraStreaming = false;
        this.cameraError = 'Permite el acceso a la cámara o sube una imagen de tu plato.';
        this.cdr.detectChanges();
      });
    }
  }

  /** Detiene el stream de video de la cámara */
  stopWebCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isCameraStreaming = false;
  }

  /** Alterna entre cámara trasera y delantera */
  toggleFacingMode() {
    this.cameraFacingMode = this.cameraFacingMode === 'environment' ? 'user' : 'environment';
    this.initWebCamera();
  }

  /** Dispara la captura desde la cámara real o Capacitor */
  async takePhoto() {
    // Si corre de manera nativa en Android/iOS con Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (photo?.dataUrl) {
          await this.handleImageCaptured(photo.dataUrl);
        }
      } catch (err: any) {
        if (!err?.message?.includes('cancelled')) {
          console.warn('Error en cámara Capacitor:', err);
        }
      }
      return;
    }

    // Si está en el navegador web con la cámara en vivo activa:
    if (this.isCameraStreaming && this.videoElementRef?.nativeElement) {
      const video = this.videoElementRef.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.stopWebCamera();
        await this.handleImageCaptured(dataUrl);
        return;
      }
    }

    // Si la cámara no inició o no hay permisos, abre el selector de archivo
    this.triggerFileInput();
  }

  /** Abre la galería de fotos del dispositivo */
  async pickFromGallery() {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });

        if (photo?.dataUrl) {
          await this.handleImageCaptured(photo.dataUrl);
        }
      } catch (err: any) {
        if (!err?.message?.includes('cancelled')) {
          console.warn('Error en galería Capacitor:', err);
        }
      }
      return;
    }

    // En navegador web abre el selector de archivos
    this.triggerFileInput();
  }

  /** Abre el explorador de archivos local */
  triggerFileInput() {
    this.fileInputRef?.nativeElement?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.ngZone.run(() => {
        this.stopWebCamera();
        this.handleImageCaptured(dataUrl);
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  /** Procesa la imagen capturada y la envía a Gemini */
  private async handleImageCaptured(dataUrl: string) {
    this.ngZone.run(() => {
      this.currentView = 'analyzing';
      this.isProcessing = true;
      this.cdr.detectChanges();
    });

    try {
      // Comprime la imagen para reducir latencia y evitar exceder límites de payload
      const compressed = await this.compressImage(dataUrl);
      this.previewImage = compressed;

      const result = await this.geminiService.analyzeFoodImage(compressed);

      this.ngZone.run(() => {
        this.analysisResult = result;
        this.selectedMealType = this.guessMealType();
        this.currentView = 'result';
        this.isProcessing = false;
        this.cdr.detectChanges();
      });
    } catch (error: any) {
      console.error('Error al analizar la imagen con Gemini:', error);
      this.ngZone.run(async () => {
        this.isProcessing = false;
        this.cdr.detectChanges();
        await this.showAnalysisError(error?.message);
        this.resetCapture();
      });
    } finally {
      this.ngZone.run(() => {
        this.isProcessing = false;
        this.cdr.detectChanges();
      });
    }
  }

  /** Confirma y registra la comida en el diario */
  async confirmMeal() {
    if (!this.analysisResult) return;
    this.isProcessing = true;
    this.cdr.detectChanges();

    try {
      const now = new Date();
      await this.diaryService.recordMeal({
        name: this.analysisResult.mealName || 'Comida',
        mealType: this.selectedMealType,
        consumedAt: now.toISOString(),
        logDate: toISODate(now),
        kcal: this.analysisResult.totalKcal,
        proteinG: this.analysisResult.proteinGrams,
        carbsG: this.analysisResult.carbsGrams,
        fatG: this.analysisResult.fatGrams,
        photoPath: this.previewImage,
      });

      // Recompensa al usuario con monedas de Gacha por registrar su comida
      this.gachaService.addCurrency(50);

      const toast = await this.toastCtrl.create({
        message: '¡Comida registrada con éxito! 🥗 (+50 🪙 de recompensa)',
        duration: 2500,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      this.resetCapture();
      this.router.navigate(['/tabs/tab1']);
    } catch (err) {
      console.error('Error guardando la comida:', err);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo guardar la comida. Inténtalo de nuevo.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  /** Permite eliminar un alimento detectado de la lista */
  removeFoodItem(index: number) {
    if (!this.analysisResult || !this.analysisResult.foods) return;
    const removed = this.analysisResult.foods.splice(index, 1)[0];
    if (removed) {
      this.analysisResult.totalKcal = Math.max(0, this.analysisResult.totalKcal - removed.kcal);
      this.cdr.detectChanges();
    }
  }

  resetCapture() {
    this.ngZone.run(() => {
      this.currentView = 'capture';
      this.previewImage = null;
      this.analysisResult = null;
      this.isProcessing = false;
      if (!Capacitor.isNativePlatform()) {
        this.initWebCamera();
      }
      this.cdr.detectChanges();
    });
  }

  private guessMealType(): MealType {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'breakfast';
    if (hour >= 12 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 20) return 'snack';
    return 'dinner';
  }

  private async showAnalysisError(msg?: string) {
    const alert = await this.alertCtrl.create({
      header: 'No pudimos analizar la foto',
      message: msg || 'Ocurrió un error consultando la API de Gemini. Revisa tu conexión a internet o intenta con otra foto.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  /**
   * Comprime y escala imágenes a un tamaño óptimo (máx 1024x1024) para agilizar el
   * envío a Gemini y prevenir saturación de memoria o límites de payload.
   */
  private compressImage(dataUrl: string, maxWidth = 1024, maxHeight = 1024, quality = 0.82): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
