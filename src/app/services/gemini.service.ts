import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FoodRecognitionResult } from '../models/food-recognition.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly apiKey = environment.gemini?.apiKey || '';
  
  // Modelos oficiales con cuota activa en tu proyecto:
  // gemini-3.1-flash-lite tiene 500 consultas por día y 15 por minuto
  private readonly primaryModel = 'gemini-3.1-flash-lite';
  private readonly backupModel = 'gemini-3.6-flash';

  /**
   * Analiza una fotografía de comida y retorna la estimación de alimentos, calorías y macros.
   * @param base64Image Imagen en formato Base64 (con o sin prefijo data:image/...)
   * @param mimeType Tipo MIME de la imagen (por defecto 'image/jpeg')
   */
  async analyzeFoodImage(base64Image: string, mimeType = 'image/jpeg'): Promise<FoodRecognitionResult> {
    if (!this.apiKey) {
      throw new Error('No se ha configurado la API Key de Gemini en environment.ts.');
    }

    // Limpia el prefijo data:...;base64, si viene incluido
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const systemPrompt = `
Eres un nutricionista y experto en análisis de alimentos por imagen de la aplicación ÑamÑam.
Analiza con atención la fotografía de la comida y estima los alimentos individuales, sus porciones, calorías y macronutrientes.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "mealName": "Nombre descriptivo de la comida o plato principal",
  "confidence": 0.94,
  "foods": [
    {
      "name": "Nombre del alimento o ingrediente",
      "portion": "Porción estimada (ej: 1 taza / 150g / 2 rebanadas)",
      "kcal": 350,
      "emoji": "🍝"
    }
  ],
  "totalKcal": 600,
  "proteinGrams": 30,
  "carbsGrams": 75,
  "fatGrams": 20
}

Reglas estrictas:
1. Las calorías de los alimentos deben sumar el "totalKcal" (o aproximarse con precisión).
2. Los macronutrientes deben ser valores enteros en gramos (proteinGrams, carbsGrams, fatGrams).
3. "confidence" debe ser un número flotante entre 0.0 y 1.0 indicando qué tan nítida y reconocible es la comida.
4. Si la imagen NO es comida o es completamente irreconocible, retorna:
   { "mealName": "Alimento no identificado", "confidence": 0.0, "foods": [], "totalKcal": 0, "proteinGrams": 0, "carbsGrams": 0, "fatGrams": 0 }
5. Responde estrictamente con el JSON, sin bloques markdown ni texto adicional.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    };

    try {
      return await this.callGemini(this.primaryModel, requestBody);
    } catch (err: any) {
      // Si el modelo principal está temporalmente ocupado (503), intentamos con el de respaldo
      if (err?.message?.includes('503') || err?.message?.includes('saturados')) {
        console.warn(`Modelo ${this.primaryModel} ocupado, probando con ${this.backupModel}...`);
        return await this.callGemini(this.backupModel, requestBody);
      }
      throw err;
    }
  }

  private async callGemini(model: string, requestBody: any): Promise<FoodRecognitionResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

      // Manejo claro de límites temporales por minuto (429 / Quota)
      if (response.status === 429 || rawMessage.toLowerCase().includes('quota') || rawMessage.toLowerCase().includes('rate')) {
        const retryMatch = rawMessage.match(/retry in ([0-9.]+)s/i);
        if (retryMatch) {
          const seconds = Math.ceil(parseFloat(retryMatch[1]));
          throw new Error(`Límite temporal alcanzado. Por favor espera ${seconds} segundos y vuelve a intentar.`);
        }
        throw new Error('Límite de consultas alcanzado. Por favor espera un momento y vuelve a intentar.');
      }

      if (response.status === 503) {
        throw new Error('Los servidores de Gemini están saturados temporalmente (503).');
      }

      throw new Error(`Error de Gemini: ${rawMessage}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini no retornó resultados para esta imagen.');
    }

    // Limpia bloques markdown tipo ```json ... ``` por si el modelo los incluyó
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed: FoodRecognitionResult = JSON.parse(cleanJson);
    return parsed;
  }
}
