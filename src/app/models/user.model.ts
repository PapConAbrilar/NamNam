export type BiologicalGender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type FitnessGoal = 'lose' | 'maintain' | 'gain';

export interface UserMetrics {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: BiologicalGender;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  targetCalories: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  hasCompletedOnboarding?: boolean;
  metrics?: UserMetrics;
}

export interface UserCredentials {
  email: string;
  password?: string;
  name?: string;
}


