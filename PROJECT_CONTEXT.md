# 🥑 ÑamÑam — Project Context & AI Guidelines

Este documento centraliza los lineamientos, arquitectura, flujo de usuario, directrices de diseño y el registro vivo de funcionalidades (*features*) del proyecto **ÑamÑam**. 
Cualquier desarrollador o agente de Inteligencia Artificial (Antigravity, Cursor, Claude, Copilot, etc.) que trabaje en este repositorio **debe consultar y respetar este archivo**.

---

## 📌 1. Información General del Proyecto

* **Nombre del Proyecto:** ÑamÑam 🍔📱
* **Curso:** IIP323W - Tecnologías y Aplicaciones Web y Móviles (Trimestre 2026-3, UDD)
* **Profesor:** Cristóbal Maturana Ahumada
* **Integrantes del Equipo:**
  * **Benjamín Pinto Manriquez** (Backend Developer)
  * **Sebastián Bünzli Garcia** (Frontend Developer)
  * **Cristóbal Ramírez Carreño** (Híbrido)

### 🎯 Problema a Resolver
Muchas personas no llevan un control diario de su alimentación y desconocen la cantidad de calorías y macronutrientes (proteínas, carbohidratos, grasas) que consumen. Los métodos tradicionales de registro manual resultan tediosos y terminan abandonándose rápidamente.

### 💡 Propuesta de Valor
Permitir a los usuarios registrar una comida simplemente tomándole una fotografía, la cual es analizada automáticamente mediante Inteligencia Artificial (**Google Gemini API**) para estimar calorías y macronutrientes. Además, combina seguimiento de metas diarias con mecánicas de gamificación (coleccionables y recompensas semanales) para motivar la constancia.

---

## 🎨 2. Filosofía y Lineamientos de Diseño

> [!IMPORTANT]
> **Lineamiento Crítico de UI:**
> El prototipo/mockup inicial define el **flujo de pantallas y la experiencia general**, pero la implementación en la app debe ser **más minimalista y limpia**.
> 
> * **Apego a Componentes Nativos de Ionic:** Se debe priorizar el uso de los componentes estándar de Ionic (`ion-card`, `ion-item`, `ion-button`, `ion-badge`, `ion-chip`, `ion-progress-bar`, `ion-modal`, `ion-fab`, `ion-segment`, `ion-list`, etc.).
> * **Evitar sobrecarga visual:** No saturar con sombras excesivas, gradientes pesados o elementos recargados. Favorecer espacios en blanco, bordes sutiles, tipografía legible y animaciones nativas del framework.
> * **Paleta de Colores Principal:**
>   * Primario / Éxito (Saludable / Lima): `#84cc16` / `#a3e635`
>   * Fondo general: `#f8fafc` o variables estándar de Ionic (`--ion-background-color`)
>   * Texto principal: `#1e293b` / `#0f172a`
>   * Macronutrientes: Proteínas (Azul), Carbohidratos (Ámbar/Amarillo), Grasas (Rojo/Coral)
> * **Modo Oscuro / Adaptabilidad:** Usar variables CSS de Ionic (`--ion-color-*`) para facilitar compatibilidad y consistencia visual entre iOS y Android.

---

## 🧭 3. Flujo de Navegación y Pantallas

El flujo de la aplicación se organiza en las siguientes etapas:

```
[ Bienvenida / Login ] ──▶ [ Onboarding (3 pasos) ] ──▶ [ Tabs Principales ]
                                                              │
                     ┌───────────────────┬────────────────────┼───────────────────┬──────────────────┐
                     ▼                   ▼                    ▼                   ▼                  ▼
             [ Tab: Inicio ]     [ Tab: Historial ]   [ Tab/Fab: Cámara ]   [ Tab: Progreso ]  [ Tab: Colección ]
                     │                                        │                                      │
                     ▼                                        ▼                                      ▼
             (Dashboard diario)                        (Resultado IA)                        (Recompensa Gacha)
```

1. **Autenticación (`welcome`)**:
   * Login y registro de usuarios (Email/Password, opción de Google/OAuth).
2. **Onboarding inicial (`onboarding`)**:
   * **Paso 1:** Datos biométricos (peso, altura, edad, sexo biológico).
   * **Paso 2:** Nivel de actividad física (sedentario, ligero, moderado, muy activo).
   * **Paso 3:** Meta nutricional (perder peso, mantenimiento, superávit) y cálculo automático de la meta calórica diaria sugerida.
3. **Dashboard / Inicio (`tab-home`)**:
   * Gráfica/indicador de calorías consumidas vs. meta restante.
   * Barras de macronutrientes consumidos en el día.
   * Racha de días consecutivos activos.
   * Lista resumida de comidas registradas hoy.
4. **Cámara / Reconocimiento IA (`camera` / `recognition`)**:
   * Captura de foto con cámara o selección desde galería (vía Capacitor Camera).
   * Envío a Google Gemini API para reconocimiento de alimentos y cálculo nutricional.
   * Pantalla de revisión/ajuste: el usuario valida porciones o agrega ítems antes de guardar.
5. **Historial / Diario (`tab-history`)**:
   * Registro histórico por fechas con detalle de comidas y cumplimiento de meta diaria.
6. **Progreso Semanal (`tab-progress`)**:
   * Gráfico comparativo de consumo diario semanal.
   * Métricas de peso, hidratación y racha.
7. **Colección y Gamificación (`tab-collection` & `reward`)**:
   * Álbum de coleccionables culinarios por rarezas (*Común*, *Raro*, *Épico*, *Legendario*).
   * Ruleta / Caja semanal que se desbloquea al cumplir rachas de registro.

---

## 🛠️ 4. Stack Técnico y Buenas Prácticas de Código

* **Framework:** Ionic Framework 9+ con **Angular 22** (arquitectura de *Standalone Components*).
* **Móvil / Runtime:** Capacitor 8 (`@capacitor/camera`, `@capacitor/storage`, `@capacitor/haptics`, etc.).
* **Estilos:** SCSS modular, utilizando variables de Ionic (`src/theme/variables.scss`).
* **Inteligencia Artificial:** Google Gemini API (análisis multimodal de imágenes con respuestas en formato JSON estructurado).
* **Persistencia / Backend:** Supabase (o servicio local en fallback con Storage / IndexedDB).

### Reglas para Desarrolladores y Agentes IA:
1. **Componentes Standalone:** En Angular moderno, no utilizar `NgModule` a menos que sea estrictamente necesario. Importar los módulos de Ionic (`IonContent`, `IonHeader`, etc.) directamente en los imports del componente.
2. **Servicios desacoplados:** La lógica de negocio, llamadas a APIs (Gemini, Supabase) y almacenamiento debe residir en servicios (`services/`), no dentro de los componentes/páginas.
3. **Tipado estricto:** Usar interfaces y modelos de TypeScript (`models/`) para alimentos, comidas, usuarios, metas y coleccionables.
4. **Actualización continua de este archivo:** Cada vez que se desarrolle o modifique una funcionalidad relevante, **se debe documentar en la Sección 5** de este archivo.

---

## � 5. Flujo de Trabajo en Git y GitHub (Git Flow)

Para mantener el orden, la trazabilidad del código y evitar conflictos entre los integrantes del equipo o agentes de IA, se establece el siguiente flujo obligatorio:

1. **Rama Base (`main`):**
   * Es la rama principal y siempre debe contener código funcional y estable.
   * **No se debe hacer commit directo a `main` para el desarrollo de features.**

2. **Creación de Ramas por Feature:**
   * Cada nueva funcionalidad, tarea o corrección debe desarrollarse en su propia rama aislada creada a partir de `main` actualizada:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feature/nombre-de-la-tarea
     ```
   * *Convención de nombres:* `feature/nueva-tarea`, `feature/onboarding-ui`, `feature/gemini-service`, `fix/nombre-del-bug`, etc.

3. **Desarrollo y Commits:**
   * Se realizan commits claros y atómicos describiendo el avance de la funcionalidad:
     ```bash
     git add .
     git commit -m "feat(modulo): descripcion clara del cambio"
     ```

4. **Publicación y Pull Request:**
   * Una vez completada y probada la feature, se publica la rama en GitHub:
     ```bash
     git push -u origin feature/nombre-de-la-tarea
     ```
   * En GitHub se abre un **Pull Request (PR)** hacia la rama `main`.
   * Tras la revisión del equipo (y verificación de que compila sin errores), se realiza el **Merge** a `main`.
   * Se actualiza la sección 6 (*Registro de Features Implementadas*) en `PROJECT_CONTEXT.md`.

---

## 🚀 6. Registro de Features Implementadas (Living Registry)

> **Instrucción para Agentes y Desarrolladores:**
> Cada vez que completes una feature o cambio estructural, agrega una entrada a esta sección explicando **qué hace**, **cómo lo hace** (archivos involucrados, servicios, lógica) y su estado actual.

### Plantilla de Entrada:
```markdown
### [Nombre de la Feature]
* **Estado:** 🟡 En Desarrollo / 🟢 Completada / 🔴 Pendiente
* **Fecha:** YYYY-MM-DD
* **Autor / Responsable:** [Nombre o Agente]
* **¿Qué hace?**: [Descripción clara de la funcionalidad para el usuario]
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/...`
  * **Servicios / Lógica:** `src/app/services/...`
  * **Modelos / Tipos:** `src/app/models/...`
  * **Detalle técnico:** [Explicación técnica concisa]
```

---

### Registro Actual:

#### 1. Configuración del Repositorio y Contexto Base
* **Estado:** 🟢 Completada
* **Fecha:** 2026-09-22
* **Autor / Responsable:** Antigravity AI
* **¿Qué hace?**:
  * Establece los lineamientos de arquitectura, directrices de diseño minimalista con componentes Ionic y la guía de referencia del proyecto para el equipo y agentes de IA.
  * Protege el repositorio ignorando la carpeta local `mockup/`.
* **¿Cómo lo hace?**:
  * **Archivos involucrados:**
    * `PROJECT_CONTEXT.md`: Archivo central de contexto, diseño y registro de features.
    * `.gitignore`: Adición de `/mockup` para no incluir artefactos de Figma/código de prueba en el control de versiones.

