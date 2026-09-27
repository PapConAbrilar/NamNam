# AI Agent Instructions for ÑamÑam

Please read and strictly follow **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** before performing any work in this codebase.

It contains:
- **Project vision & requirements**
- **Design guidelines:** Minimalist UI strictly adhering to native Ionic components (`ion-*`)
- **Architecture & user flow** (Auth, Onboarding, Tabs, AI Recognition with Gemini)
- **Git Flow:** Never commit directly to `main`. Always create a branch `feature/<task-name>` from `main`, commit isolated changes, push, and open a PR.
- **Feature Registry & Status:** A living record of implemented features in `PROJECT_CONTEXT.md`. Every time you implement or change a feature, you must update the "Registro de Features Implementadas" specifying what it does and how it does it.
- **CRITICAL STATUS RULE:** AI agents must **NEVER** mark a feature as `🟢 Completada`. You must always register or update it as `🟡 En Revisión`. **Only a human developer can validate and change the status to `🟢 Completada`.**

## Known Pending Tasks

Deferred by the team. Do not implement them unless a human asks, but keep them in mind when working on related code. For the full work handoff see **[HANDOFF.md](./HANDOFF.md)**.

- **Route guard for `/tabs` (auth protection):** There are no route guards yet. After logging out (`app-logout-button` → `AuthService.logout()` → `/login`), a user can still open `/tabs/*` by typing the URL and will see the app with no session ("Usuario" as the name). The fix is a functional `canActivate` guard in `src/app/app.routes.ts` / `src/app/tabs/tabs.routes.ts`:
  - no session (`AuthService.isAuthenticated === false`) → redirect to `/login`;
  - session but `hasCompletedOnboarding === false` → redirect to `/onboarding`.

  If `AuthService` has been migrated to Supabase Auth by then, the guard must wait for the session to be restored (`supabase.auth.getSession()`) before deciding.



