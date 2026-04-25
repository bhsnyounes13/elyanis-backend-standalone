# EL-YANIS — API (backend)

Dépôt autonome extrait de la plateforme immobilière : serveur **Express** + **Prisma** (PostgreSQL).

## Prérequis

- Node.js 20+
- PostgreSQL (ou URL distante, ex. Railway)

## Installation

```bash
npm install
cp .env.example .env
# Renseigner DATABASE_URL, JWT_ACCESS_SECRET, FRONTEND_ORIGIN, etc.
npx prisma db push
# optionnel : npx prisma db seed
```

## Commandes

| Script            | Rôle                                    |
| ----------------- | --------------------------------------- |
| `npm run dev`     | API en mode watch (tsx)                 |
| `npm run build`   | Compilation TypeScript → `dist/`        |
| `npm start`       | Lancement (`node dist/index.js`)         |
| `npm run db:push` | Synchronise le schéma Prisma (dev)      |
| `npm run db:seed` | Exécute le seed                         |

Variables : voir **`.env.example`**.

**Monolithe (front + API)** : placer le build Vite (`dist/`) à la racine de ce dépôt et activer `SERVE_SPA=true` pour que l’API serve aussi le site statique (voir `src/app.ts`).

## Railway (Railpack)

Le dépôt doit inclure à la racine au minimum : **`package.json`**, **`package-lock.json`**, **`src/`** (sources), **`prisma/`**, **`tsconfig.json`**. Railpack détecte le projet via `package.json` ; le build exécute `npm ci && npm run build` (voir `railway.json`).

Sans `package.json` / lock, le build échoue : « no provider matched ». `dist/` seul ne suffit pas : il faut versionner le lock et, pour recompiler sur la plateforme, les **sources** TypeScript.

## Publier sur un nouveau dépôt Git

Dans ce dossier (déjà initialisé en git si vous avez suivi l’extraction) :

```bash
git init
git add .
git commit -m "Initial commit: API EL-YANIS"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/elyanis-backend.git
git push -u origin main
```

Remplacez l’URL par un dépôt **vide** créé sur GitHub (ou autre hébergeur).
