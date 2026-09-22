import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonProgressBar,
  IonButton,
  IonIcon,
  IonInput,
  IonCard,
  IonCardContent,
  IonBadge,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  flameOutline,
  scaleOutline,
  barbellOutline,
  arrowForwardOutline,
  arrowBackOutline,
  checkmarkCircle,
  sparklesOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import {
  BiologicalGender,
  ActivityLevel,
  FitnessGoal,
  UserMetrics,
} from '../../models/user.model';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonProgressBar,
    IonButton,
    IonIcon,
    IonInput,
    IonCard,
    IonCardContent,
    IonBadge,
  ],
})
export class OnboardingPage {
  currentStep = 1;
  totalSteps = 3;
  isLoading = false;

  // Paso 1: Biometría
  weightKg: number | null = 70;
  heightCm: number | null = 170;
  age: number | null = 25;
  gender: BiologicalGender = 'male';

  // Paso 2: Actividad
  activityLevel: ActivityLevel = 'moderate';
  readonly activityOptions: Array<{ id: ActivityLevel; title: string; desc: string }> = [
    { id: 'sedentary', title: 'Sedentario', desc: 'Poco o ningún ejercicio regular' },
    { id: 'light', title: 'Ligero', desc: 'Actividad física 1 a 3 días por semana' },
    { id: 'moderate', title: 'Moderado', desc: 'Entrenamiento 3 a 5 días por semana' },
    { id: 'active', title: 'Muy Activo', desc: 'Entrenamiento intenso 6 a 7 días por semana' },
  ];

  // Paso 3: Meta principal
  goal: FitnessGoal = 'maintain';
  readonly goalOptions: Array<{ id: FitnessGoal; title: string; desc: string; emoji: string }> = [
    { id: 'lose', title: 'Perder Peso', desc: 'Déficit calórico controlado (-400 kcal/día)', emoji: '🔥' },
    { id: 'maintain', title: 'Mantenimiento', desc: 'Equilibrio energético saludable', emoji: '⚖️' },
    { id: 'gain', title: 'Ganar Masa', desc: 'Superávit para fuerza y desarrollo (+350 kcal/día)', emoji: '💪' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) {
    addIcons({
      flameOutline,
      scaleOutline,
      barbellOutline,
      arrowForwardOutline,
      arrowBackOutline,
      checkmarkCircle,
      sparklesOutline,
    });
  }

  get progressValue(): number {
    return this.currentStep / this.totalSteps;
  }

  // Cálculo TMB / TDEE usando la fórmula de Mifflin-St Jeor
  get calculatedCalories(): number {
    const weight = Number(this.weightKg) || 70;
    const height = Number(this.heightCm) || 170;
    const age = Number(this.age) || 25;

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += this.gender === 'male' ? 5 : -161;

    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };

    const tdee = bmr * (activityMultipliers[this.activityLevel] || 1.55);

    let target = tdee;
    if (this.goal === 'lose') target -= 400;
    if (this.goal === 'gain') target += 350;

    return Math.max(1200, Math.round(target / 10) * 10);
  }

  get calculatedProtein(): number {
    // 25% de calorías provenientes de proteínas (4 kcal/g)
    return Math.round((this.calculatedCalories * 0.25) / 4);
  }

  get calculatedCarbs(): number {
    // 50% de calorías provenientes de carbohidratos (4 kcal/g)
    return Math.round((this.calculatedCalories * 0.50) / 4);
  }

  get calculatedFat(): number {
    // 25% de calorías provenientes de grasas (9 kcal/g)
    return Math.round((this.calculatedCalories * 0.25) / 9);
  }

  selectGender(gender: BiologicalGender) {
    this.gender = gender;
  }

  selectActivity(activity: ActivityLevel) {
    this.activityLevel = activity;
  }

  selectGoal(goal: FitnessGoal) {
    this.goal = goal;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.weightKg || this.weightKg < 30 || this.weightKg > 300) {
        this.showToast('Por favor ingresa un peso válido en kg (30 - 300).', 'warning');
        return;
      }
      if (!this.heightCm || this.heightCm < 100 || this.heightCm > 250) {
        this.showToast('Por favor ingresa una altura válida en cm (100 - 250).', 'warning');
        return;
      }
      if (!this.age || this.age < 12 || this.age > 110) {
        this.showToast('Por favor ingresa una edad válida (12 - 110 años).', 'warning');
        return;
      }
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async finishOnboarding() {
    if (this.isLoading) return;
    this.isLoading = true;

    const loading = await this.loadingCtrl.create({
      message: 'Personalizando tus metas...',
      spinner: 'crescent',
    });
    await loading.present();

    const metrics: UserMetrics = {
      weightKg: Number(this.weightKg),
      heightCm: Number(this.heightCm),
      age: Number(this.age),
      gender: this.gender,
      activityLevel: this.activityLevel,
      goal: this.goal,
      targetCalories: this.calculatedCalories,
      targetProteinGrams: this.calculatedProtein,
      targetCarbsGrams: this.calculatedCarbs,
      targetFatGrams: this.calculatedFat,
    };

    try {
      const res = await this.authService.completeOnboarding(metrics);
      await loading.dismiss();
      this.isLoading = false;

      if (res.success) {
        await this.showToast('¡Tu plan nutricional está listo! 🥑', 'success');
        this.router.navigate(['/tabs']);
      } else {
        await this.showToast(res.message || 'No se pudo guardar el perfil', 'danger');
      }
    } catch {
      await loading.dismiss();
      this.isLoading = false;
      await this.showToast('Ocurrió un error al guardar tu perfil.', 'danger');
    }
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

