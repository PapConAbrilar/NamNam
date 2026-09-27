export interface DetectedFoodItem {
  name: string;
  portion: string;
  kcal: number;
  emoji: string;
}

export interface FoodRecognitionResult {
  mealName: string;
  confidence: number;
  foods: DetectedFoodItem[];
  totalKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}
