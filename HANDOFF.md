# HANDOFF — Estado de trabajo para agentes IA

> Documento de traspaso para que un agente IA retome el trabajo. Léelo junto con [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) (reglas obligatorias: Git Flow, componentes Ionic nativos, estado `🟡 En Revisión`, nunca `🟢 Completada`).
>
> **Última actualización:** 2026-09-27

---

## 1. Dónde quedamos

- **Rama:** `feature/tabs-supabase-data`, creada desde `main`.
- **Commits:** ninguno. Todo está como cambios sin commitear.
- **Push:** el usuario pidió explícitamente **no hacer push**. No hagas push ni abras PR sin su confirmación.
- **Cambios mezclados:** la rama también contiene cambios previos del usuario que estaban sin commitear en `main` (`angular.json`, `src/app/tab1/*`, `src/app/tab3/*`, `src/app/tabs/*`). **No son de este trabajo.** Pregunta al usuario antes de commitearlos juntos o por separado.
- **Build:**
  - `npx ng build --configuration development` → compila sin errores.
  - `npx ng build` (producción) → **falla por un problema previo**: `src/app/pages/onboarding/onboarding.page.scss` pesa 4.86 kB y el budget `anyComponentStyle` tiene error en 4 kB (`angular.json`). Tab4 y tab5 solo dan warning (> 2 kB).
- **Verificación visual:** no se ha hecho. Nadie abrió la app en el navegador después de los cambios.

---

## 2. Qué se implementó

### Tabs (UI)
Las tres replican el layout de las capturas de diseño que dio el usuario, con la **paleta oscura de tab1** (card `rgba(33,33,33,0.9)`, borde `rgba(148,163,184,0.18)`, radio 22px, lima `#84cc16`, azul `#3b82f6`, ámbar `#f59e0b`, rojo `#ef4444`). La paleta y los mixins compartidos están en `src/theme/_namnam.scss` (`@use '../../theme/namnam' as nn;`).

| Tab | Ruta | Contenido |
|---|---|---|
| tab2 — Diario Alimenticio | `/tabs/tab2` | Comidas de 14 días agrupadas por día ("Hoy — Dom 27 Sep", "Ayer — …"), badge y barra consumido/meta (ámbar si se excede), emoji por tipo, hora, kcal |
| tab4 — Progreso Semanal | `/tabs/tab4` | Barras L–D (azul bajo meta / ámbar sobre meta / lima hoy / tenue futuro), leyenda, 4 stat cards (días con meta, racha y récord, peso y variación, agua promedio y meta), macros promedio vs. meta |
| tab5 — Colección ÑamÑam | `/tabs/tab5` | Hero con contador desbloqueados, "Próximo Tiro Gacha" con % y botón "Abrir Recompensa Semanal" (AlertController con el premio), grid 3 columnas, bloqueados con blur + 🔒, badge de rareza |

Patrón común de las páginas: standalone, `inject()`, `signal()`, control flow `@if/@for`, recarga en `ionViewWillEnter`, `ion-refresher`, `ion-spinner` de carga y estado de error con "Reintentar". Los imports de Ionic salen de `@ionic/angular`, igual que el resto del proyecto.

### Capa de datos
```
Páginas → DiaryService / ProgressService / CollectionService / GoalService
        → NutritionRepository / CollectionRepository   (clases abstractas usadas como token de DI)
        → Supabase*Repository  (si environment.supabase.url y anonKey están completos)
          Mock*Repository      (si no; datos del prototipo relativos a "hoy")
```
- La selección se hace en `src/app/services/data/data.providers.ts` → `provideDataLayer()`, registrado en `src/main.ts`.
- Los repositorios Supabase **no filtran por `user_id`**: confían en RLS (`auth.uid()`). Mapean `snake_case` → `camelCase`.
- `MockCollectionRepository` persiste los desbloqueos en `localStorage` (`namnam_mock_collection`). Para reiniciar la demo, borra esa clave.
- El mock genera una racha actual de 7 días y un récord de 12 (`LOGGED_OFFSETS` en `mock-nutrition.repository.ts`).

### Reglas de negocio (en los servicios)
- **Meta del día:** `GoalService.getResolver()` devuelve la última fila de `nutrition_goals` con `validFrom <= fecha`. Si no hay filas, usa `authService.currentUser.metrics` y, como último recurso, 2000 kcal.
- **Semana:** de lunes a domingo (`startOfWeek` en `utils/date.utils.ts`). Las fechas de día son strings locales `YYYY-MM-DD`.
- **Día con meta:** tiene comidas y `kcal <= targetKcal`. El denominador es siempre 7.
- **Racha actual:** días consecutivos con comidas, contando desde hoy, o desde ayer si hoy aún no hay registros. **Récord:** la racha más larga en los últimos 365 días.
- **Peso:** último registro. La variación se calcula contra el último registro anterior al lunes de la semana.
- **Agua:** promedio diario de los días de la semana que tienen registros.
- **Macros semanales:** promedio diario de los días registrados, comparado con la meta vigente hoy.
- **Gacha:** `REWARD_DAYS_REQUIRED = 7` días con comidas en la semana actual. Una recompensa por semana. Pesos: común 60 / raro 25 / épico 12 / legendario 3 (`reward-draw.ts`). **Deben coincidir con la función SQL `open_weekly_reward`.**

### Base de datos
- `supabase/schema.sql`: SQL ejecutable (tablas, vista `daily_nutrition_summary` con `security_invoker`, función `open_weekly_reward` con `security definer`, trigger `handle_new_user`, RLS, bucket `meal-photos`, seed de 9 coleccionables).
- `supabase/README.md`: guía para humanos (pasos de conexión, diagrama ER, columnas, RLS).
- El schema **no se ha ejecutado** contra ningún proyecto Supabase real. Aún no hay credenciales.

---

## 3. Archivos tocados

**Nuevos**
```
HANDOFF.md
supabase/schema.sql
supabase/README.md
src/theme/_namnam.scss
src/app/utils/date.utils.ts
src/app/models/nutrition.model.ts
src/app/models/collection.model.ts
src/app/services/supabase.service.ts
src/app/services/goal.service.ts
src/app/services/diary.service.ts
src/app/services/progress.service.ts
src/app/services/collection.service.ts
src/app/services/data/nutrition.repository.ts
src/app/services/data/collection.repository.ts
src/app/services/data/supabase-nutrition.repository.ts
src/app/services/data/supabase-collection.repository.ts
src/app/services/data/mock-nutrition.repository.ts
src/app/services/data/mock-collection.repository.ts
src/app/services/data/reward-draw.ts
src/app/services/data/data.providers.ts
src/app/tab4/tab4.page.scss        (antes estaba vacío)
src/app/tab5/tab5.page.scss
src/app/components/logout-button/logout-button.component.ts   (botón de logout con confirmación)
```
**Modificados**
```
src/app/tab2/tab2.page.{html,scss,ts}   (reescritos)
src/app/tab4/tab4.page.{html,ts}        (reescritos; tab4 venía como placeholder del usuario)
src/app/tab5/tab5.page.{html,ts}        (reescritos; tab5 venía como placeholder del usuario)
src/environments/environment.ts         (+ bloque supabase { url, anonKey } vacío)
src/environments/environment.prod.ts    (ídem)
src/main.ts                             (+ provideDataLayer())
package.json / package-lock.json        (+ @supabase/supabase-js ^2.117.2)
PROJECT_CONTEXT.md                      (+ entrada #5 en el registro, 🟡 En Revisión)
```
`src/app/tab1..tab5/*.page.{html,ts}` también incluyen `<app-logout-button>` en el toolbar.

No se tocaron: `auth.service.ts`, `tabs/`, login, onboarding. En tab1 y tab3 solo se agregó el botón de logout.

---

## 4. Próximos pasos (en orden sugerido)

1. **Revisión visual** de tab2, tab4 y tab5 con `ionic serve`, y ajustes que pida el usuario.
2. **Commit** en `feature/tabs-supabase-data`, previa consulta sobre los cambios ajenos (sección 1). Sin push hasta que el usuario lo autorice.
3. **Migrar `AuthService` a Supabase Auth** (`signInWithPassword`, `signUp`, `signInWithOAuth`, `onAuthStateChange`). Es un **bloqueante**: sin sesión de Supabase, RLS devuelve listas vacías. Hay que mantener la API pública actual (`currentUser`, `currentUser$`, `login`, `register`, `completeOnboarding`, `logout`) para no romper login ni onboarding. Los IDs pasan a ser UUID.
4. `completeOnboarding` → actualizar `profiles` e insertar la primera fila en `nutrition_goals`.
5. Flujo de cámara/IA (tab3) → insertar en `meals` con `log_date = toISODate(new Date())` (hora local), la foto en el bucket `meal-photos/<user_id>/…` y `source = 'ai'`. Llamar a Gemini desde una **Supabase Edge Function**, nunca con la API key en el cliente. Habrá que agregar métodos de escritura (`addMeal`, `addWater`, `addWeight`) a `NutritionRepository` y sus dos implementaciones.
6. Conectar tab1 (Inicio, hoy con valores fijos) a `daily_nutrition_summary`, `GoalService` y la tabla `activities` (calorías quemadas). Para eso falta `getActivities` en el repositorio.
7. Agregar un guard `canActivate` en `/tabs` que exija sesión (hoy tras el logout se puede volver escribiendo la URL).
8. Opcional: bajar el SCSS de onboarding, tab4 y tab5 bajo los budgets, o ajustar los budgets de `angular.json` con el equipo.
9. Opcional: `PROJECT_CONTEXT.md` menciona `@capacitor/storage`, que fue reemplazado por `@capacitor/preferences`.

---

## 5. Convenciones a respetar

- Toda la lógica va en `services/`. Las páginas solo consumen servicios.
- Todo acceso nuevo a datos se agrega **primero al repositorio abstracto** y luego a **ambas** implementaciones (Supabase y mock), para que la app siga funcionando sin credenciales.
- Al cambiar reglas del gacha, sincroniza `reward-draw.ts`, `collection.service.ts` y `open_weekly_reward` en `schema.sql`.
- Al cambiar el esquema, actualiza `schema.sql` y `supabase/README.md`.
- Cada feature nueva o modificada se registra en `PROJECT_CONTEXT.md` como `🟡 En Revisión`.
