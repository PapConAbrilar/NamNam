# Módulo de Gacha — MVP

## Qué incluye

- **Pull** (tirada simple 100🪙 / x5 500🪙 → 6 resultados), instantáneo,
  sin animación.
- **Probabilidades por rareza**: Común 60% / Raro 30% / Épico 8% /
  Legendario 2%, uniforme dentro de cada tier.
- **Colección**: catálogo de 19 ítems, con estado bloqueado/desbloqueado.
- **Merge**: tocar un ítem desbloqueado intenta subirlo de rango al
  instante (sin confirmación ni animación), con feedback vía
  `ToastController` — mismo patrón que usa `login.page.ts`.
- **Persistencia**: `localStorage` (moneda + inventario), igual que
  `AuthService`. Balance inicial: 1000🪙.

## Qué NO incluye (fuera de alcance de este MVP)

- Animaciones (destellos, caja idle, oscurecimiento de pantalla, fusión
  circular) — la versión completa con esto existe por separado si más
  adelante quieren agregarlas.
- Mascota / `PetWidget`.
- Backend real / adaptador simulado con delay y fallos — el pull y el
  merge son síncronos y locales.
- Crafting (recetas) — el catálogo no las incluye en esta versión.

## Cómo se usa

```ts
import { Component } from '@angular/core';
import { GachaCollectionComponent } from '../gacha/components/gacha-collection/gacha-collection.component';

@Component({
  standalone: true,
  imports: [GachaCollectionComponent],
  template: `<app-gacha-collection />`,
})
export class TabCollectionPage {}
```

Eso es todo — el componente trae su propio balance, botones de tirar, y
grid de colección con merge incluido. No necesita `@Input` ni
configuración adicional.

## Otorgar moneda desde el resto de la app

```ts
constructor(private gacha: GachaService) {}

// cuando corresponda (ej. al registrar una comida):
this.gacha.addCurrency(35);
```

## Archivos

```
src/app/gacha/
├── models/gacha.types.ts
├── data/catalog.ts
├── data/rarity-config.ts
├── engine/gacha-engine.ts
├── services/gacha.service.ts
└── components/gacha-collection/
    ├── gacha-collection.component.ts
    ├── gacha-collection.component.html
    └── gacha-collection.component.scss
```
