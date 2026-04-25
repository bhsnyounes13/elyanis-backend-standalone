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

### Variables obligatoires sur Railway (runtime)

Tant que les logs indiquent **`Manquant : DATABASE_URL, JWT_ACCESS_SECRET`**, l’API **ne démarre pas** : le code est correct, mais les variables ne sont **pas** injectées sur **ce** service. Il faut les ajouter dans l’**onglet du service** qui exécute `npm start` (pas seulement au niveau du projet, sauf partage explicite).

#### 1. Créer une base (si ce n’est pas déjà fait)

Dans le **même projet** Railway : **New** → **Database** → **PostgreSQL** (ou ajouter le plugin existant). Notez le **nom exact** du service dans le graphe (souvent `Postgres` ; s’il s’appelle `PostgreSQL` ou `ma-db`, on utilisera ce nom dans la référence).

#### 2. Brancher `DATABASE_URL` sur l’API

1. Ouvrir le service **de l’API** (`elyanis-backend-standalone` ou le nom de votre conteneur Node).
2. Onglet **Variables**.
3. **Add variable** (ou *New variable*).
4. Clé : `DATABASE_URL`.
5. Pour la valeur, utiliser une **variable reference** (bouton *Reference* / *Variable reference*) : choisir le service **Postgres** → variable `DATABASE_URL`.  
   En texte, cela ressemble à : ` ${{ NomDuServicePostgres.DATABASE_URL}} ` (sans espace inutile ; le nom `NomDuServicePostgres` = nom du service sur le schéma Railway).
6. **Deploy / Redeploy** le service API pour appliquer les changements.

Sans cette étape, `process.env.DATABASE_URL` est **vide** côté conteneur (les logs le confirment).

#### 3. Secret JWT (obligatoire, toujours manuel)

Toujours dans **Variables** du service API : ajoutez

`JWT_ACCESS_SECRET` = une chaîne aléatoire d’**au moins 32 caractères** (générer avec un gestionnaire de mots de passe ou `openssl rand -base64 32`).

#### 4. CORS / cookies (`FRONTEND_ORIGIN` ou domaine public)

- Si le **site** est ailleurs (Vercel, autre URL Railway) : `FRONTEND_ORIGIN` = l’URL **exacte** du navigateur, **sans** slash final, ex. `https://elyanis-production.up.railway.app`.
- Si l’API a un **domaine public généré** sur Railway, `RAILWAY_PUBLIC_DOMAIN` peut suffire en repli ; sinon définir explicitement `FRONTEND_ORIGIN`.

L’avertissement de démarrage *« FRONTEND_ORIGIN et RAILWAY_PUBLIC_DOMAIN absents »* disparaît quand l’une de ces origines est connue (variable ou domaine public).

| Variable | Rôle |
| -------- | ---- |
| `DATABASE_URL` | Via référence `${{ ServicePostgres.DATABASE_URL }}` (voir ci-dessus). |
| `JWT_ACCESS_SECRET` | Secret JWT, **≥ 32 caractères** (défini manuellement). |
| `FRONTEND_ORIGIN` | URL du site ou du front, ou comptez sur un domaine public + `RAILWAY_PUBLIC_DOMAIN`. |

En production, définissez aussi `TURNSTILE_SECRET_KEY` si les formulaires doivent être protégés (voir `.env.example`).

L’avertissement `npm warn config production Use --omit=dev` vient de l’environnement npm sur la plateforme ; il est sans impact sur l’API.

Documentation Railway : [Variables & références](https://docs.railway.com/develop/variables#referencing-another-service), [PostgreSQL](https://docs.railway.com/databases/postgresql).

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
