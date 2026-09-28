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
4. **Actualización continua de este archivo:** Cada vez que se desarrolle o modifique una funcionalidad relevante, **se debe documentar en la Sección 6** de este archivo.

---

## 🔁 5. Flujo de Trabajo en Git y GitHub (Git Flow)

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

> [!IMPORTANT]
> **REGLA ESTRICTA DE ESTADO PARA AGENTES IA:**
> Los agentes de IA **NUNCA** deben marcar una feature como `🟢 Completada`. Al implementar o modificar una funcionalidad, el agente **debe registrarla exclusivamente como `🟡 En Revisión`**.
> **Únicamente un desarrollador humano puede probar la funcionalidad, dar el visto bueno y cambiar el estado a `🟢 Completada`.**

> **Instrucción para Desarrolladores y Agentes:**
> Cada vez que se desarrolle una feature o cambio estructural, agrega una entrada a esta sección explicando **qué hace**, **cómo lo hace** (archivos involucrados, servicios, lógica) y su estado actual.

### Plantilla de Entrada:
```markdown
### [Nombre de la Feature]
* **Estado:** 🟡 En Revisión (Agente) / 🟢 Completada (Solo validada por humano) / 🔴 Pendiente
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
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Establece los lineamientos de arquitectura, directrices de diseño minimalista con componentes Ionic, flujo de Git/GitHub y la guía de referencia del proyecto para el equipo y agentes de IA.
  * Protege el repositorio ignorando la carpeta local `mockup/`.
* **¿Cómo lo hace?**:
  * **Archivos involucrados:**
    * `PROJECT_CONTEXT.md`: Archivo central de contexto, diseño y registro de features.
    * `AGENTS.md`: Guía de entrada directa para agentes de IA.
    * `.gitignore`: Adición de `/mockup` para no incluir artefactos de Figma/código de prueba en el control de versiones.

#### 2. Pantalla de Bienvenida / Login y Redirección por Defecto
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-22
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Implementa la pantalla inicial de autenticación permitiendo alternar entre "Iniciar Sesión" y "Registrarse" mediante un segmento minimalista.
  * Incluye campos nativos (`ion-input fill="outline" shape="round"`) para nombre (modo registro), correo y contraseña con toggle de visibilidad (`ion-input-password-toggle`), eliminando choques de contraste en modo oscuro.
  * Botón de acción principal con alto contraste (texto oscuro sobre verde lima de marca `#84cc16`), enlace de recuperación de contraseña y botón social de Google adaptado a temas claro y oscuro.
  * Establece esta vista como la ruta por defecto al abrir la aplicación (`/login`).
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/pages/login/login.page.ts`, `src/app/pages/login/login.page.html`, `src/app/pages/login/login.page.scss`
  * **Rutas:** `src/app/app.routes.ts` (añade redirección de `''` a `'login'` y carga diferida `loadComponent` de `LoginPage`).
  * **Estilos / Tema:** `src/theme/variables.scss` (define paleta primaria `#84cc16` con `--ion-color-primary-contrast: #1a1a2e` para máxima legibilidad).
  * **Detalle técnico:** Componente standalone de Angular 22 con `@ionic/angular` utilizando componentes nativos (`ion-content`, `ion-segment`, `ion-input`, `ion-input-password-toggle`, `ion-button`, `ion-icon`) con directivas modernas (`@if`). Elimina wrappers `ion-item`/`ion-list` para evitar fondos claros forzados sobre fondos oscuros.

#### 3. Lógica de Autenticación Local y Gestión de Sesión (AuthService)
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-22
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Implementa el registro e inicio de sesión local para la primera etapa del proyecto sin requerir backend externo (preparado para migración futura a Supabase).
  * Soporta:
    * Registro de nuevos usuarios con validación de email y longitud de contraseña (mínimo 6 caracteres).
    * Inicio de sesión validando credenciales contra usuarios almacenados localmente.
    * Usuario de prueba predeterminado precargado: `demo@namnam.com` / `password123`.
    * Simulación de inicio de sesión con Google (OAuth local).
    * Persistencia de sesión activa en `localStorage` y estado reactivo vía `currentUser$`.
    * Feedback visual con `LoadingController` (spinner de carga) y `ToastController` (notificaciones de error y bienvenida).
* **¿Cómo lo hace?**:
  * **Modelos / Tipos:** `src/app/models/user.model.ts` (interfaces `UserProfile` y `UserCredentials`).
  * **Servicios / Lógica:** `src/app/services/auth.service.ts` (`login`, `register`, `loginWithGoogle`, `logout`, almacenamiento en `localStorage` y estado con `BehaviorSubject`).
  * **Componentes / Vistas:** `src/app/pages/login/login.page.ts` y `login.page.html` (invocación de servicios, control de estados de carga con `[disabled]="isLoading"` y despliegue de mensajes Toast).

#### 4. Flujo de Onboarding y Perfilamiento Nutricional
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-22
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Guía a los nuevos usuarios registrados en un asistente paso a paso de 3 etapas para crear su perfil nutricional:
    * **Paso 1 (Biometría):** Captura de peso (kg), altura (cm), edad y sexo biológico (masculino/femenino) con validaciones de rangos saludables.
    * **Paso 2 (Nivel de Actividad):** Selección entre 4 niveles (Sedentario, Ligero, Moderado, Muy Activo) que definen el factor multiplicador de actividad física.
    * **Paso 3 (Meta Nutricional y Cálculo TDEE):** Selección de objetivo (Perder Peso 🔥, Mantenimiento ⚖️, Ganar Masa 💪). Calcula en tiempo real la meta calórica diaria mediante la fórmula de Mifflin-St Jeor junto al desglose estimado de macronutrientes (25% proteínas, 50% carbohidratos, 25% grasas).
  * Redirige automáticamente desde el Login/Registro al Onboarding si el usuario no ha completado este proceso (`hasCompletedOnboarding: false`).
  * Al completar el asistente, actualiza el perfil en `AuthService`, guarda las métricas en almacenamiento local y navega al dashboard principal (`/tabs`).
* **¿Cómo lo hace?**:
  * **Modelos / Tipos:** `src/app/models/user.model.ts` (tipos `BiologicalGender`, `ActivityLevel`, `FitnessGoal` e interfaz `UserMetrics`).
  * **Servicios / Lógica:** `src/app/services/auth.service.ts` (método `completeOnboarding` que actualiza la sesión y el registro de usuarios).
  * **Componentes / Vistas:** `src/app/pages/onboarding/onboarding.page.ts`, `onboarding.page.html`, `onboarding.page.scss` (componente standalone con `ion-header`, `ion-progress-bar`, `ion-input`, `ion-card` y estilos adaptables al modo oscuro/claro).
  * **Rutas:** `src/app/app.routes.ts` (añade ruta `onboarding` con carga perezosa).

#### 5. Tabs Historial, Progreso y Colección con Capa de Datos Preparada para Supabase
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-27
* **Autor / Responsable:** Claude (agente IA) & Cristóbal Ramírez
* **¿Qué hace?**:
  * **Historial (tab2 — Diario Alimenticio):** comidas de los últimos 14 días agrupadas por día ("Hoy", "Ayer", fechas), con badge y barra de consumido vs. meta del día, emoji por tipo de comida, hora y kcal.
  * **Progreso (tab4 — Progreso Semanal):** gráfico de barras L–D (azul bajo meta, ámbar sobre meta, lima hoy), tarjetas de días con meta, racha actual/récord, peso actual con variación semanal y agua promedio, y macros promedio de la semana vs. meta.
  * **Colección (tab5 — Colección ÑamÑam):** álbum de 9 coleccionables por rareza (bloqueados con desenfoque y candado), progreso hacia el "Tiro Gacha" (días registrados en la semana) y botón para abrir la recompensa semanal.
  * Todas las tabs leen de Supabase cuando `environment.supabase` tiene credenciales; sin ellas usan repositorios mock con los datos del prototipo. Incluyen pull-to-refresh, estados de carga y error, y recargan al entrar a la tab.
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/tab2/`, `src/app/tab4/`, `src/app/tab5/` (componentes standalone con signals y control flow `@if`/`@for`, paleta oscura de tab1 compartida en `src/theme/_namnam.scss`).
  * **Servicios / Lógica:** `src/app/services/diary.service.ts`, `progress.service.ts`, `collection.service.ts`, `goal.service.ts`, `supabase.service.ts`.
  * **Repositorios:** `src/app/services/data/` — contratos abstractos `NutritionRepository` y `CollectionRepository` con implementaciones Supabase y mock, seleccionadas en `data.providers.ts` (`provideDataLayer()` en `main.ts`).
  * **Modelos / Tipos:** `src/app/models/nutrition.model.ts`, `src/app/models/collection.model.ts`; utilidades de fecha local en `src/app/utils/date.utils.ts`.
  * **Base de datos:** `supabase/schema.sql` (tablas, vista `daily_nutrition_summary`, función `open_weekly_reward`, RLS, bucket de fotos y catálogo inicial) documentado en `supabase/README.md`.
  * **Detalle técnico:** dependencia `@supabase/supabase-js`. Las consultas no filtran por usuario; lo hacen las políticas RLS con `auth.uid()`, por lo que se requiere migrar `AuthService` a Supabase Auth para ver datos reales. El sorteo de la recompensa se ejecuta en el servidor.

#### 6. Botón de Cierre de Sesión (Logout)
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-27
* **Autor / Responsable:** Claude (agente IA) & Cristóbal Ramírez
* **¿Qué hace?**:
  * Agrega un botón con ícono de salida en el toolbar de las 5 tabs. Al tocarlo pide confirmación ("Cancelar" / "Salir"); al confirmar cierra la sesión y vuelve a la pantalla de login, reiniciando el historial de navegación.
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/components/logout-button/logout-button.component.ts` (componente standalone `app-logout-button` con `ion-button` + `ion-icon` `log-out-outline`), insertado dentro de `ion-buttons slot="end"` en `tab1` a `tab5`.
  * **Servicios / Lógica:** usa `AuthService.logout()` existente, `AlertController` para la confirmación y `NavController.navigateRoot('/login')`.
  * **Detalle técnico:** aún no existen guards de ruta, por lo que tras cerrar sesión se puede volver a `/tabs` escribiendo la URL. Pendiente: agregar un `canActivate` que exija sesión.

#### 7. Reconocimiento Fotográfico de Alimentos con Gemini IA y Capacitor Camera
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-27
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Permite capturar fotos de comidas mediante transmisión en vivo de la cámara real en el visor (WebRTC / Capacitor Camera) con soporte para alternar entre cámara frontal y trasera, o seleccionarlas desde la galería / explorador de archivos.
  * Envía la imagen a la API multimodal de **Google Gemini 3.8 Flash** solicitando un análisis nutricional con respuesta estricta en formato JSON.
  * Detecta los alimentos individuales con sus porciones estimadas, emojis y calorías, además de totalizar las calorías y los macronutrientes (proteínas, carbohidratos, grasas) y calcular el nivel de confianza del reconocimiento.
  * Ofrece una pantalla de revisión interactiva donde el usuario puede editar el nombre del plato, seleccionar el tipo de comida (desayuno, almuerzo, cena, snack), eliminar alimentos detectados incorrectamente y confirmar el registro.
  * Al confirmar, almacena la comida en `NutritionRepository` (mock local persistido o Supabase) a través de `DiaryService`, actualizando de inmediato los datos del Dashboard (tab1), del Historial (tab2) y del Progreso (tab4).
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/tab3/tab3.page.ts`, `tab3.page.html`, `tab3.page.scss` (interfaz con visor de cámara en vivo en `<video>`, botón de rotación de cámara, captura por `<canvas>`, análisis con radar animado, vista de resultados y confirmación, compresión de imagen previa al envío y sincronización reactiva con `NgZone` y `ChangeDetectorRef`).
  * **Servicios / Lógica:** 
    * `src/app/services/gemini.service.ts`: servicio multimodal con pool de respaldo ordenado (`gemini-flash-latest`, `gemini-3.7-flash`, `gemini-3.8-flash`) usando la API Key de `environment.ts` para tolerar picos de alta demanda de Google.
    * `src/app/services/diary.service.ts`: método `recordMeal(...)`.
    * `src/app/services/data/nutrition.repository.ts`, `mock-nutrition.repository.ts`, `supabase-nutrition.repository.ts`: implementación de `addMeal(...)`.
  * **Modelos:** `src/app/models/food-recognition.model.ts` (`FoodRecognitionResult`, `DetectedFoodItem`).
  * **Dependencias:** `@capacitor/camera` y WebRTC `navigator.mediaDevices.getUserMedia` para soporte nativo y web.

#### 8. Sistema de Gamificación Gacha, Colección Interactiva y Crafteo
* **Estado:** � Completada (Validada por Benjamín Pinto)
* **Fecha:** 2026-09-27
* **Autor / Responsable:** Sebastián Bünzli, Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * Implementa un sistema de gamificación completo con tiradas de Gacha (tirada simple 100🪙 / tirada x5 500🪙) basadas en probabilidades ponderadas por rareza (Común 60%, Raro 30%, Épico 8%, Legendario 2%).
  * Catálogo de 19 alimentos coleccionables con emojis, rarezas, rangos (+1, +2...) y estado de posesión bloqueado/desbloqueado.
  * Sistema de crafteo mediante el cual los usuarios pueden combinar ingredientes coleccionados para crear nuevos platos especiales (recetas culinarias).
  * Sistema de fusión (*merge*) para subir de rango los duplicados obtenidos y botón de selección de mascota/acompañante favorito (⭐).
  * Integración transversal en el flujo de la aplicación:
    * Otorga automáticamente +50🪙 de recompensa al registrar exitosamente una comida con la cámara IA en Tab 3.
    * Otorga +500🪙 al completar y abrir el reto semanal en Tab 5.
  * Embebido directamente en la **Tab 5 (Colección)** con estilos adaptados al modo oscuro de ÑamÑam, y disponible adicionalmente en la ruta `/gacha`.
* **¿Cómo lo hace?**:
  * **Componentes / Vistas:** `src/app/gacha/components/gacha-collection/` (`gacha-collection.component.ts`, `.html`, `.scss`), `src/app/gacha/pages/gacha-page/`, integrado dentro de `src/app/tab5/tab5.page.html` y `tab5.page.ts`.
  * **Servicios / Lógica:** 
    * `src/app/gacha/services/gacha.service.ts`: servicio centralizado con estado reactivo (`BehaviorSubject`), persistencia en `localStorage`, métodos `pull`, `mergeItem`, `craft`, `selectPet` y `addCurrency`.
    * `src/app/gacha/engine/gacha-engine.ts`: motor aleatorio ponderado para selección de rarezas e ítems.
  * **Modelos y Datos:** `src/app/gacha/models/gacha.types.ts`, `src/app/gacha/data/catalog.ts` (catálogo y recetas), `src/app/gacha/data/rarity-config.ts` (probabilidades y costos).
  * **Integración en Tab 3:** inyección de `GachaService` en `src/app/tab3/tab3.page.ts` y llamada a `addCurrency(50)` en `confirmMeal()`.

#### 9. Route Guards de Autenticación, Conexión Dinámica de Tab 1 e Integración Completa con Supabase
* **Estado:** 🟢 Completada (Validada por Benjamín Pinto - PR #8)
* **Fecha:** 2026-09-27
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * **Seguridad de Rutas (`authGuard`, `onboardingGuard`):** Protege el acceso a `/tabs` y `/gacha` exigiendo sesión activa. Si no hay sesión redirige a `/login`; si no se ha completado el onboarding redirige a `/onboarding`. Protege `/onboarding` impidiendo acceso si ya fue completado.
  * **Dashboard Dinámico en Tiempo Real (Tab 1):** Conecta el anillo de calorías restantes, calorías consumidas, objetivo y desglose de macronutrientes a datos reales calculados desde `DiaryService` y `GoalService`. Muestra la lista de comidas registradas hoy con actualización automática al entrar a la tab y soporte para `ion-refresher`.
  * **Integración Completa con Supabase y Aislamiento por Usuario:**
    * **Autenticación y Perfil:** Conecta `AuthService` con `supabase.auth`, guardando biometría, metas y estado de onboarding en `profiles` y `nutrition_goals`.
    * **Gamificación y Monedas:** Sincroniza saldo de monedas (`gacha_currency`) y mascota seleccionada (`pet_item_id`) en `profiles`, y el inventario de ítems obtenidos, niveles de fusión y copias en `public.user_gacha_inventory`.
    * **Aislamiento Estricto por Usuario:** Particionado de claves de almacenamiento (`namnam_gacha_*_<userId>`) y reseteo reactivo inmediato al cerrar sesión o cambiar de cuenta, garantizando que usuarios distintos o el login de Google Demo nunca compartan o contaminen el inventario del otro.
    * **Catálogo de 19 Alimentos del Gacha:** Se registraron todos los ítems del Gacha con sus emojis, nombres y rarezas en `public.collectibles` de `supabase/schema.sql` y en el repositorio local.
    * **Recompensas en el flujo:** Al registrar una comida en `DiaryService`, se premia al usuario otorgando automáticamente monedas en su billetera de Supabase.
  * **Ajuste de Budgets:** Modifica presupuestos de compilación en `angular.json` para permitir estilos completos de componentes sin errores de build.
* **¿Cómo lo hace?**:
  * **Guards:** `src/app/guards/auth.guard.ts` (`authGuard`, `onboardingGuard`) con soporte para esperar la restauración asíncrona de sesión (`waitForSession()`).
  * **Rutas:** `src/app/app.routes.ts`, `src/app/tabs/tabs.routes.ts`.
  * **Servicios:** 
    * `src/app/services/auth.service.ts` (sesión, login, registro, getter `isCurrentSessionSupabase` y estabilización del ID demo).
    * `src/app/services/diary.service.ts` (`getTodaySummary()` y recompensas de monedas).
    * `src/app/gacha/services/gacha.service.ts` (particionado de almacenamiento por `userId`, reseteo al desloguearse y sincronización bidireccional con `profiles` y `user_gacha_inventory`).
    * `src/app/services/data/mock-collection.repository.ts` (catálogo sincronizado con los 19 ítems).
  * **Vistas:** `src/app/tab1/tab1.page.ts`, `tab1.page.html`.
  * **Base de Datos:** `supabase/schema.sql` con definición de tablas `profiles`, `nutrition_goals`, `meals`, `activities`, `collectibles` (con los 19 ítems del catálogo), `user_collectibles`, `user_gacha_inventory`, `reward_claims`, políticas RLS y función `open_weekly_reward`.

#### 10. Optimización Responsive de Tab 1, Consulta a Gemini API y Reactividad Zoneless en Tab 3
* **Estado:** 🟡 En Revisión
* **Fecha:** 2026-09-28
* **Autor / Responsable:** Antigravity AI & Benjamín Pinto
* **¿Qué hace?**:
  * **Ajuste Responsive de la Tab Inicio (Tab 1):** Reorganiza el resumen calórico para pantallas móviles (Mobile First) apilando el anillo calórico centrado y disponiendo las 3 métricas ("Consumidas", "Objetivo", "Progreso") en una cuadrícula inferior de ancho completo con bordes sutiles. Elimina el desbordamiento de números grandes y etiquetas cortadas.
  * **Ajuste de Macronutrientes y Comidas:** Corrige el espaciado y anchos mínimos de las filas de macronutrientes para evitar quiebres de línea en valores como `150g / 250g` y mejora el contraste de colores en modo oscuro.
  * **Optimización de GeminiService:** Elimina el bucle de reintento que multiplicaba peticiones y consumía la cuota diaria. Configura como modelo principal **`gemini-3.1-flash-lite`** (con cuota gratuita activa de **500 peticiones/día y 15 RPM**) y respaldo automático en **`gemini-3.6-flash`** ante saturación temporal (503).
  * **Corrección de Reactividad y Descongelamiento en Tab 3:** Corrige el problema donde la pantalla se quedaba congelada en "Analizando tu comida..." tras la llamada asíncrona a Gemini. Se implementa reactividad nativa mediante Signals de Angular y se configura el Change Detection Zoneless en `main.ts`, logrando que la transición a la vista de resultados ("Resultado IA 🤖") ocurra de forma instantánea y automática apenas el modelo responde, sin requerir cambiar de pestaña ni interacción adicional.
* **¿Cómo lo hace?**:
  * **Configuración Angular:** `src/main.ts` (añade `provideZonelessChangeDetection()` para el correcto procesamiento de eventos asíncronos en arquitecturas sin Zone.js).
  * **Vistas y Componentes:** 
    * `src/app/tab1/tab1.page.scss` (reestructuración flex/grid responsive con breakpoints `@media (min-width: 480px)` y `@media (max-width: 360px)`).
    * `src/app/tab3/tab3.page.ts` (migración del estado a `signal()`: `currentView`, `previewImage`, `analysisResult`, `selectedMealType`, `isProcessing`, `isCameraStreaming`, `cameraError`, e invocación directa de `appRef.tick()`).
    * `src/app/tab3/tab3.page.html` (consumo de signals reactivos con control flow `@if`, actualización de etiquetas visuales a "Gemini 3.1 Flash Lite" y enlace con `onMealTypeChange`).
  * **Servicios:** `src/app/services/gemini.service.ts` (llamada a `gemini-3.1-flash-lite` con fallback a `gemini-3.6-flash` y formateo de errores de cuota en español).




