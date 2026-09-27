# Resumen de cambios: Tabs Historial, Progreso y Colección + preparación para Supabase

> **Fecha:** 2026-09-27 · **Rama:** `feature/tabs-supabase-data` (sin commits ni push aún) · **Estado:** 🟡 En Revisión

Este documento resume qué se cambió y qué herramientas se agregaron. Para el detalle técnico de traspaso ver [HANDOFF.md](./HANDOFF.md). Para la base de datos ver [supabase/README.md](./supabase/README.md).

---

## Qué se cambió

### Pantallas
- **Tab 2 — Diario Alimenticio:** se reescribió según la captura de diseño. Muestra las comidas agrupadas por día con su barra de consumido vs. meta.
- **Tab 4 — Progreso Semanal:** se reescribió según la captura de diseño. Incluye el gráfico de barras de lunes a domingo, las tarjetas de días con meta, racha, peso y agua, y los macros de la semana.
- **Tab 5 — Colección ÑamÑam:** se reescribió según la captura de diseño. Incluye el álbum de coleccionables, el progreso del gacha y el botón para abrir la recompensa semanal.
- **Colores:** se usó la misma paleta de la tab 1 (tarjetas oscuras, lima `#84cc16`, y azul, ámbar y rojo para los macros).
- **Botón de cerrar sesión:** se agregó en el toolbar de las 5 tabs (`src/app/components/logout-button/`). Pide confirmación antes de salir y vuelve a la pantalla de login.
- **Estilos compartidos:** se centralizaron en `src/theme/_namnam.scss` para no repetir colores y tarjetas en cada tab.

### Datos
- **Modelos** (`src/app/models/`): tipos para comidas, metas, peso, agua y coleccionables.
- **Servicios** (`src/app/services/`): calculan el diario por día, las rachas, los promedios semanales y el progreso del gacha.
- **Repositorios** (`src/app/services/data/`): definen de dónde salen los datos.
  - **Sin credenciales de Supabase:** la app usa datos de prueba iguales a los de las capturas.
  - **Con credenciales:** lee todo desde Supabase, sin tener que modificar las pantallas.
- **Configuración:**
  - Se agregaron los campos `supabase.url` y `supabase.anonKey` (vacíos) en `environment.ts` y `environment.prod.ts`.
  - Se registró la capa de datos en `main.ts`.

### Documentación y base de datos
- `supabase/schema.sql`: SQL listo para ejecutar en el SQL Editor de Supabase.
- `supabase/README.md`: estructura de la base de datos y pasos para conectar.
- `HANDOFF.md`: documento de traspaso para que una IA retome el trabajo.
- `PROJECT_CONTEXT.md`: nueva entrada #5 en el registro de features, marcada como 🟡 En Revisión.

### Qué NO se tocó
`auth.service.ts`, la barra de tabs, login y onboarding. En tab 1 y tab 3 solo se agregó el botón de cerrar sesión.

---

## Herramientas agregadas

### En la app
| Herramienta | Versión | Para qué |
|---|---|---|
| `@supabase/supabase-js` | 2.117.2 | Librería oficial para conectarse a Supabase |

Es la **única dependencia nueva** y quedó registrada en `package.json` y `package-lock.json`. Todo lo demás usa lo que ya tenía el proyecto (Angular, Ionic y SCSS). No se agregaron librerías de gráficos: las barras del progreso semanal están hechas con HTML y CSS.

### En Supabase (se crean al ejecutar `schema.sql`)
No son dependencias de la app, sino objetos de la base de datos:
- **Función `open_weekly_reward`:** sortea la recompensa semanal en el servidor, para que no se pueda manipular desde la app.
- **Trigger `on_auth_user_created`:** crea automáticamente el perfil de cada usuario nuevo.
- **Bucket de Storage `meal-photos`:** espacio para guardar las fotos de las comidas.

---

## Pendientes importantes
1. **Migrar el login a Supabase Auth.** Supabase solo entrega datos a usuarios que iniciaron sesión con Supabase Auth. Mientras `AuthService` siga siendo local, las tabs se verán vacías al poner las credenciales.
2. **El build de producción (`ng build`) falla por un problema previo.** `onboarding.page.scss` pesa 4.86 kB y supera el límite de 4 kB. No es causado por estos cambios.
3. **La rama incluye cambios anteriores sin commitear** en tab 1, tab 3, la barra de tabs y `angular.json`. Hay que decidir si van en el mismo commit o en uno aparte.
4. **No hay protección de rutas:** después de cerrar sesión se puede volver a `/tabs` escribiendo la URL. Falta un guard.
5. **Falta la revisión visual** de las tres tabs en la app (`ionic serve`).
