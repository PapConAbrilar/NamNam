# ÑamÑam 🍔📱

Proyecto desarrollado para el curso **IIP323W-Tecnologías y Aplicaciones Web y Móviles** (Trimestre 2026-3, Sección 1) en la Universidad del Desarrollo.

**Profesor:** Cristóbal Maturana Ahumada

## 🎯 Problema a Resolver
Actualmente, la gente no lleva un registro de su alimentación y no saben cuántas calorías, azúcares, grasas, etc. consumen al día.

## 💡 Propuesta de Valor
Permitir a los usuarios registrar una comida con una foto y que automáticamente detecte las calorías y macronutrientes, para poder ver el progreso diario de sus límites y metas.

## 👥 Usuario Objetivo
Personas entre 18 y 40 años, que buscan mejorar su alimentación registrándola.

## ✨ Funcionalidades Principales (MVP)
*   **Registro fotográfico:** Captura de alimentos.
*   **Análisis nutricional:** Conteo de calorías y macronutrientes.
*   **Gestión de objetivos:** Asignación de metas diarias/semanales.
*   **Gamificación:** Sistema de coleccionables semi-aleatorios.
*   **Historial:** Registro visual de comidas.

## 🛠️ Stack y Dependencias
*   **Frontend:** Ionic con Angular + Capacitor.
*   **Inteligencia Artificial (APIs):** Google Gemini API (Para detección de fotos).
*   **Base de Datos:** Supabase (Si nos da el tiempo en el desarrollo, sino se usará local).
*   **Despliegue:** Vercel (Si nos da el tiempo en el desarrollo, sino se usará local).
*   **Herramientas de gestión:** GitHub.

## 🎨 Diseño y Mockup
El diseño de la aplicación y sus vistas principales fue prototipado en Figma.
*   [Ver Mockup interactivo en Figma](https://www.figma.com/make/eXtwSKckUtr2zUun89aMS3/%C3%91am%C3%91am?fullscreen=1&t=6rvXeGeu0RnhjjuJ-1&code-node-id=0-6).

## 👨‍💻 Integrantes del Equipo
*   **Benjamín Eduardo Pinto Manriquez:** Backend Developer (b.pintom@udd.cl).
*   **Sebastian Ignacio Bünzli Garcia:** Frontend Developer (s.bunzlig@udd.cl).
*   **Cristobal Ramirez Carreño:** Híbrido (cri.ramirezc@udd.cl).

## 📅 Cronograma de Desarrollo
| Semana | Fecha | Hito / Entregable | Responsable |
| :--- | :--- | :--- | :--- |
| 1 | 31-08 | Propuesta + Mockup inicial | Benjamín Pinto |
| 2 | 07-09 | Interfaz de la app (componentes Ionic) | Sebastián Bünzli |
| 3 | 21-09 | Consumo de API REST | Cristobal Ramirez |
| 4 | 28-09 | Presentación + Control 1 | Todos |

## ⚠️ Riesgos y Supuestos
*   **Supuestos Técnicos:** Asumimos que la cantidad de fotos subidas no sobrepasará los tokens de la API de Gemini, y que los usuarios tomarán fotos solo de la comida.
*   **Riesgos de Diseño:** Existe el riesgo de que la gamificación incentive a comer de más únicamente para poder registrar más comidas.

