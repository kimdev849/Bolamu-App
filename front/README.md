 # PHARMACIE SANS RUPTURE
## Technical Requirements Document & Roadmap de Développement Complet

**Ecosystème complet :** Web (Pharmacie · Grossiste · Entreprise Livraison · Admin) + App Mobile Livreur  
**Version 2.0 — 24 Juillet 2026**  
**Brazzaville, République du Congo**  
**Produit :** PSR / PharmaFlow

---

## Table des Matières

1. [Compréhension du Projet & Vision](#1-compréhension-du-projet--vision)
2. [Stack Technique Complète](#2-stack-technique-complète)
3. [Architecture Générale de l'Ecosystème](#3-architecture-générale-de-lécosystème)
4. [Architecture Backend (Node.js / Express / TypeScript)](#4-architecture-backend)
5. [Architecture Frontend Web (Angular + TailwindCSS)](#5-architecture-frontend-web)
6. [Application Mobile Livreur (React Native + Expo)](#6-application-mobile-livreur)
7. [Dashboard Entreprise de Livraison (Angular)](#7-dashboard-entreprise-de-livraison)
8. [Modèle de Données (PostgreSQL + Prisma)](#8-modèle-de-données)
9. [API REST — Spécification Complète](#9-api-rest--spécification-complète)
10. [Workflows Métier Détaillés](#10-workflows-métier-détaillés)
11. [Sécurité](#11-sécurité)
12. [Roadmap de Développement — 70 Étapes](#12-roadmap-de-développement--70-étapes)
13. [Déploiement & Infrastructure](#13-déploiement--infrastructure)

---

## 1. Compréhension du Projet & Vision

### 1.1 Le Problème
Un client demande un médicament à sa pharmacie habituelle. Le produit est en rupture. Le client doit alors parcourir plusieurs pharmacies pour le trouver, perdant du temps et de la patience. La pharmacie perd une vente et potentiellement un client.

### 1.2 La Solution PSR
La pharmacie crée une demande sur PSR. La plateforme notifie simultanément tous les grossistes partenaires via leur dashboard web. Le premier grossiste qui confirme la disponibilité remporte la commande. PSR crée alors une commande, coordonne le paiement, et assigne une entreprise de livraison partenaire pour récupérer le produit chez le grossiste et le livrer à la pharmacie.

### 1.3 L'Écosystème Complet

```
                         PHARMAFLOW / PSR
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   PHARMACIES            GROSSISTES       ENTREPRISES LIVRAISON
    (Web/App)            (Dashboard)         (Dashboard)
        |                     |                     |
        |                     |                     v
        |                     |               Livreur (Mobile)
        |                     |               React Native + Expo
        |                     |
        +---------------------+---------------------+
                              |
                              v
                    BACKEND (Node.js/Express)
                              |
                              v
                    POSTGRESQL + PRISMA
                              |
                    +---------+---------+
                    |         |         |
                    v         v         v
                 PawaPay   Firebase    GPS
                 (Phase2)  Cloud Msg   (Externe)
```

### 1.4 Les 4 Produits/Interfaces

| Produit | Description |
|---------|-------------|
| **PSR Web** | Angular + TailwindCSS. Pour pharmacies, grossistes, entreprises de livraison, administrateurs. |
| **PSR Driver** | React Native + Expo. Pour les livreurs des entreprises de livraison partenaires. |
| **PSR Backend** | Node.js + Express + TypeScript. API REST, logique métier, orchestration. |
| **PSR Database** | PostgreSQL + Prisma. Données, traçabilité, audit. |

### 1.5 Règles Métier Fondamentales

- Les grossistes n'ont **PAS** d'API externe. Ils utilisent le dashboard web PSR.
- Le mécanisme de confirmation est **'First-Come-First-Served'** avec verrouillage SQL atomique.
- Les commissions sont configurables depuis l'admin et sont à **0%** au lancement.
- Le paiement est **manuel** en MVP (hors plateforme). PawaPay arrive en Phase 2.
- Une demande expire après **30 minutes** si aucun grossiste ne répond.
- La pharmacie peut annuler une demande tant qu'elle est en statut `SEARCHING`.
- PSR assigne la livraison à une **ENTREPRISE** de livraison (pas à un livreur individuel).
- C'est l'entreprise de livraison qui assigne la mission à **SES** propres livreurs via son dashboard.
- Le livreur utilise l'application mobile **PSR Driver** pour accepter, suivre et confirmer la livraison.
- La confirmation de livraison se fait par **code OTP** généré par le système et communiqué à la pharmacie.
- L'entreprise de livraison reçoit son paiement via PSR et c'est elle qui rémunère ses livreurs.
- Toutes les actions sensibles sont tracées dans un **journal d'audit immuable**.

---

## 2. Stack Technique Complète

### 2.1 Frontend Web (Angular)

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Angular 17+ (Standalone Components, Signals) |
| Langage | TypeScript 5.x |
| Styling | TailwindCSS 3.4+ |
| UI | Composants personnalisés Tailwind |
| State | RxJS + Angular Signals |
| HTTP | Angular HttpClient |
| Routing | Angular Router (lazy loading) |
| Icons | Lucide Angular / Heroicons |
| Forms | Reactive Forms + Validators |
| Build | Angular CLI |

### 2.2 Application Mobile Livreur (React Native + Expo)

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React Native 0.74+ (New Architecture) |
| Toolchain | Expo SDK 51+ (Managed Workflow) |
| Langage | TypeScript strict |
| Styling | NativeWind (TailwindCSS pour React Native) |
| Navigation | Expo Router v3 (file-based routing) |
| State Management | Zustand |
| HTTP Client | Axios avec interceptors |
| Notifications Push | expo-notifications + Firebase Cloud Messaging |
| Localisation GPS | expo-location |
| Camera / Photos | expo-camera + expo-image-picker |
| Storage local | AsyncStorage (expo-secure-store pour tokens) |
| OTP Input | react-native-otp-inputs |
| Maps externe | Lien profond vers Google Maps / Apple Maps / Waze |
| Build & Deploy | EAS Build |

### 2.3 Backend

| Catégorie | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4.x |
| Langage | TypeScript |
| Base de données | PostgreSQL 15+ |
| ORM | Prisma ORM 5.x |
| Authentification | JWT (access + refresh tokens) |
| Validation | Zod |
| Documentation API | Swagger / OpenAPI |
| Tests | Jest + Supertest |
| Logging | Winston |
| WebSockets | Socket.io (notifications temps réel dashboard) |

### 2.4 Infrastructure & Services Externes

| Catégorie | Solution |
|-----------|----------|
| Frontend Web Hosting | Vercel |
| Backend Hosting | Railway / Render / VPS |
| Base de données | Supabase PostgreSQL / Railway Managed DB |
| Stockage fichiers | Supabase Storage / AWS S3-compatible |
| Notifications Push | Firebase Cloud Messaging (FCM) |
| Email | Resend / SendGrid |
| SMS | Twilio / Africa's Talking (optionnel Phase 2) |
| CI/CD | GitHub Actions |
| Monitoring erreurs | Sentry |
| Uptime | UptimeRobot |
| Paiement (Phase 2) | PawaPay (ou API directe MTN/Airtel) |

---

## 3. Architecture Générale de l'Écosystème

PSR est composé de 4 produits distincts qui communiquent tous via une seule API REST.

### 3.1 Diagramme d'Architecture

```
+-------------------------------+
|          UTILISATEURS          |
|  Pharmacie  Grossiste  Entreprise  Livreur  |
|   (Web)      (Web)      (Web)     (Mobile)  |
|   Angular   Angular    Angular   React Native |
|  Tailwind  Tailwind   Tailwind      Expo     |
+---------------+---------------+---------------+---------------+
                |               |               |               |
                +---------------+---------------+---------------+
                                |
                         HTTPS / REST API
                                |
                +---------------v---------------+
                |         BACKEND PSR            |
                |    Node.js / Express / TS      |
                |  Auth | Requests | Orders |     |
                |  Deliveries | Payments |      |
                |  Commissions | Notifications |   |
                +---------------+---------------+
                                |
                +---------------+---------------+
                |               |               |
                v               v               v
         +-----------+   +-----------+   +-----------+
         |PostgreSQL |   | Firebase  |   |  PawaPay  |
         |  + Prisma |   |    FCM    |   | (Phase 2) |
         +-----------+   +-----------+   +-----------+
```

### 3.2 Flux de Données par Produit

**A. Pharmacie (Web Angular) :**  
Crée demande → Reçoit confirmation grossiste → Valide commande → Suit livraison → Reçoit produit → Confirme par OTP

**B. Grossiste (Web Angular) :**  
Reçoit notification demande → Voir dashboard → Clique 'Disponible' (verrouillage SQL) → Prépare commande → Remet au livreur

**C. Entreprise de Livraison (Web Angular) :**  
Reçoit mission → Accepte/Refuse mission → Assigne à un livreur → Suit en temps réel → Reçoit confirmation

**D. Livreur (App React Native + Expo) :**  
Reçoit push notification mission → Accepte → Navigue vers grossiste (GPS externe) → Récupère produit → Navigue vers pharmacie → Livre → Saisit code OTP → Livraison confirmée

### 3.3 Séparation des Responsabilités

- **PSR** gère : la demande, la commande, le paiement, la mission de livraison, la commission.
- **Le grossiste** gère : la confirmation de disponibilité, la préparation du produit, la remise au livreur.
- **L'entreprise de livraison** gère : l'acceptation de la mission, l'assignation à SES livreurs, la supervision.
- **Le livreur** gère : l'acceptation individuelle, le trajet, la récupération, la livraison, le code OTP.
- **La pharmacie** gère : la création de la demande, la validation, la réception, la confirmation OTP.

---

## 4. Architecture Backend (Node.js / Express / TypeScript)

Le backend est organisé en modules indépendants. Chaque module encapsule son contrôleur, service, repository et routes.

### 4.1 Structure des Dossiers

```
psr-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/          -> database.ts, env.ts, logger.ts, firebase.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── pharmacies/
│   │   ├── wholesalers/
│   │   ├── delivery-companies/
│   │   ├── delivery-agents/
│   │   ├── requests/      <- MODULE CRITIQUE (FCFS)
│   │   ├── orders/
│   │   ├── deliveries/
│   │   ├── commissions/
│   │   ├── subscriptions/
│   │   ├── notifications/
│   │   └── admin/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── tsconfig.json
├── package.json
└── docker-compose.yml
```

### 4.2 Services Critiques

| Service | Description |
|---------|-------------|
| `AuthService` | Login, register, refresh, forgot-password, reset-password |
| `RequestService` | Création demande, diffusion FCFS, verrouillage SQL, expiration |
| `OrderService` | Création commande depuis demande FOUND, calcul montants |
| `DeliveryService` | Création mission, attribution entreprise, suivi statuts |
| `DeliveryAgentService` | Gestion livreurs (CRUD par entreprise), assignation mission |
| `CommissionService` | Calcul dynamique selon commission_rules active |
| `NotificationService` | Notifications internes (dashboard) + push FCM (mobile) |
| `AuditService` | Enregistrement immuable de toutes les actions sensibles |
| `FCMService` | Envoi push notifications via Firebase Cloud Messaging |

### 4.3 Middlewares

| Middleware | Rôle |
|------------|------|
| `auth.middleware.ts` | Vérifie JWT, attache `req.user` |
| `rbac.middleware.ts` | Vérifie le rôle requis pour la route |
| `validate.middleware.ts` | Valide `req.body` / `req.params` / `req.query` avec Zod |
| `error.middleware.ts` | Catch toutes les erreurs, format JSON uniforme |
| `rate-limit.middleware.ts` | Limite les requêtes (login: 5/min, confirm: 10/min) |

### 4.4 Verrouillage FCFS (Module Requests)

Le cœur du système. Une seule requête SQL atomique garantit qu'un seul grossiste peut confirmer.

```typescript
async confirmAvailability(requestId: string, wholesalerId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.request.updateMany({
      where: { id: requestId, status: 'SEARCHING' },
      data: { status: 'FOUND', foundById: wholesalerId, foundAt: new Date() },
    });
    if (request.count === 0) {
      throw new ApiError(409, 'Demande deja traitee par un autre grossiste');
    }
    const updatedRequest = await tx.request.findUnique({
      where: { id: requestId }, include: { pharmacy: true },
    });
    const order = await tx.order.create({
      data: {
        reference: generateRef('ORD'), requestId: requestId,
        pharmacyId: updatedRequest.pharmacyId, wholesalerId: wholesalerId,
        productAmount: 0, deliveryAmount: 0, commissionAmount: 0, totalAmount: 0,
        orderStatus: 'CREATED', paymentStatus: 'PENDING', deliveryStatus: 'PENDING',
      },
    });
    await tx.requestResponse.create({
      data: { requestId: requestId, wholesalerId: wholesalerId, responseType: 'CONFIRMED' },
    });
    return { request: updatedRequest, order };
  });
  await notifyOtherWholesalers(requestId, wholesalerId);
  return result;
}
```

---

## 5. Architecture Frontend Web (Angular + TailwindCSS)

L'application web Angular est le portail professionnel pour pharmacies, grossistes, entreprises de livraison et administrateurs.

### 5.1 Structure des Dossiers Angular

```
psr-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/          -> auth.guard.ts, role.guard.ts, no-auth.guard.ts
│   │   │   ├── interceptors/    -> auth.interceptor.ts, error.interceptor.ts
│   │   │   ├── services/        -> auth.service.ts, api.service.ts, notification.service.ts, socket.service.ts
│   │   │   └── core.config.ts
│   │   ├── shared/
│   │   │   ├── components/      -> button, input, select, modal, table, badge, card, sidebar, navbar, toast, loader, empty-state, pagination
│   │   │   ├── pipes/             -> status-color.pipe.ts, currency.pipe.ts, date-ago.pipe.ts
│   │   │   └── directives/        -> click-outside.directive.ts, auto-focus.directive.ts
│   │   ├── features/
│   │   │   ├── auth/              -> login, register, forgot-password pages
│   │   │   ├── pharmacy/          -> dashboard, requests, orders, deliveries, subscription, profile
│   │   │   ├── wholesaler/        -> dashboard, requests, orders, history, profile
│   │   │   ├── delivery-company/  -> dashboard, missions, agents, history, profile
│   │   │   └── admin/             -> dashboard, pharmacies, wholesalers, delivery-companies, orders, commissions, subscriptions, reports, settings
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   ├── styles.css
│   ├── index.html
│   └── main.ts
├── tailwind.config.js
├── angular.json
└── package.json
```

### 5.2 Routes Principales et Sous-Routes

**Route racine :** `''` → `redirectTo '/auth/login'`

| Module | Routes | Rôles |
|--------|--------|-------|
| `/auth/*` | `/login`, `/register`, `/forgot-password` | Public |
| `/pharmacy/*` | `/dashboard`, `/requests`, `/requests/new`, `/requests/:id`, `/orders`, `/orders/:id`, `/deliveries`, `/subscription`, `/profile` | `PHARMACY_ADMIN`, `PHARMACY_USER` |
| `/wholesaler/*` | `/dashboard`, `/requests`, `/requests/:id`, `/orders`, `/orders/:id`, `/history`, `/profile` | `WHOLESALER_ADMIN`, `WHOLESALER_USER` |
| `/delivery-company/*` | `/dashboard`, `/missions`, `/missions/:id`, `/agents`, `/agents/new`, `/agents/:id`, `/history`, `/profile` | `DELIVERY_ADMIN`, `DELIVERY_USER` |
| `/admin/*` | `/dashboard`, `/pharmacies`, `/wholesalers`, `/delivery-companies`, `/orders`, `/commissions`, `/subscriptions`, `/reports`, `/settings` | `SUPER_ADMIN` |

### 5.3 Composants Partagés (Shared)

| Composant | Description |
|-----------|-------------|
| `ButtonComponent` | Primaire, secondaire, danger, outline, ghost (Tailwind) |
| `InputComponent` | Text, number, email, password, textarea avec label, erreur, icône, hint |
| `SelectComponent` | Dropdown avec recherche, multi-select optionnel |
| `ModalComponent` | Overlay avec header, body scrollable, footer actions |
| `TableComponent` | Tableau générique avec tri, pagination, recherche, actions row |
| `BadgeComponent` | Statuts colorés (SEARCHING=orange, FOUND=blue, DELIVERED=green, EXPIRED=gray) |
| `CardComponent` | Conteneur avec header, body, footer, shadow Tailwind |
| `SidebarComponent` | Navigation latérale responsive, collapse mobile, icons Lucide |
| `NavbarComponent` | Barre supérieure avec logo, notifications bell, profil dropdown, logout |
| `ToastComponent` | Notifications toast stack auto-dismiss |
| `LoaderComponent` | Spinner global (overlay) et inline (button/skeleton) |
| `EmptyStateComponent` | Illustration + message quand aucune donnée |
| `PaginationComponent` | Contrôles de pagination réutilisables |

### 5.4 Services Angular

| Service | Description |
|---------|-------------|
| `AuthService` | Login, register, logout, refreshToken, forgotPassword, resetPassword |
| `ApiService` | Wrapper HttpClient avec baseURL, headers, interceptors |
| `PharmacyService` | CRUD pharmacies, profil, abonnement, statistiques |
| `RequestService` | Créer demande, lister, annuler, détail, polling statut |
| `OrderService` | Lister commandes, détail, confirmer paiement manuel |
| `DeliveryService` | Suivi livraisons, statuts, détail |
| `WholesalerService` | Réception demandes, confirmer/refuser, lister commandes |
| `DeliveryCompanyService` | Missions, agents, assignations, historique |
| `AdminService` | Gestion globale, validation, commissions, statistiques |
| `NotificationService` | Toast internes, compteur notifications, marquer lu |
| `SocketService` | WebSocket temps réel (nouvelles demandes, statuts) |

---

## 6. Application Mobile Livreur (React Native + Expo)

L'application mobile est dédiée aux livreurs des entreprises de livraison partenaires.

### 6.1 Stack Technique Mobile

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React Native 0.74+ (New Architecture) |
| Toolchain | Expo SDK 51+ (Managed Workflow) |
| Langage | TypeScript strict |
| Styling | NativeWind (TailwindCSS pour React Native) |
| Navigation | Expo Router v3 (file-based routing) |
| State Management | Zustand |
| HTTP Client | Axios avec interceptors |
| Notifications Push | expo-notifications + Firebase Cloud Messaging |
| Localisation GPS | expo-location |
| Camera / Photos | expo-camera + expo-image-picker |
| Storage local | AsyncStorage (expo-secure-store pour tokens) |
| OTP Input | react-native-otp-inputs |
| Maps externe | Lien profond vers Google Maps / Apple Maps / Waze |
| Build & Deploy | EAS Build |

### 6.2 Structure des Dossiers (Expo Router)

```
psr-driver/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx           <- Layout auth (pas de tabs)
│   │   ├── login.tsx             <- Écran connexion livreur
│   │   └── forgot-password.tsx   <- Mot de passe oublié
│   ├── (app)/
│   │   ├── _layout.tsx           <- Layout principal (tabs bottom)
│   │   ├── index.tsx             <- Tab Accueil / Dashboard livreur
│   │   ├── missions/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         <- Liste missions disponibles
│   │   │   ├── [id].tsx          <- Détail mission + actions
│   │   │   └── current.tsx       <- Mission en cours (si active)
│   │   ├── history/
│   │   │   └── index.tsx         <- Historique livraisons
│   │   ├── earnings/
│   │   │   └── index.tsx         <- Gains / paiements
│   │   └── profile/
│   │       └── index.tsx         <- Profil, documents, paramètres
│   ├── _layout.tsx               <- Root layout (auth check, fonts)
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── ui/                   -> Button, Card, Badge, Input, Modal, Loader
│   │   ├── mission/              -> MissionCard, MissionStepper, OTPInput, ProofPhoto
│   │   └── layout/               -> Header, BottomTabBar, SafeAreaWrapper
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   ├── useNotifications.ts
│   │   └── useMission.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── mission.store.ts
│   │   └── notification.store.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── mission.service.ts
│   │   └── notification.service.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json
├── eas.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 6.3 Routes (Expo Router)

| Route | Écran |
|-------|-------|
| `/(auth)/login` | Connexion livreur (téléphone + password) |
| `/(auth)/forgot-password` | Réinitialisation mot de passe |
| `/(app)/` | Dashboard / Accueil (mission en cours) |
| `/(app)/missions` | Liste missions disponibles |
| `/(app)/missions/[id]` | Détail mission + boutons d'action |
| `/(app)/missions/current` | Mission active (navigation étapes) |
| `/(app)/history` | Historique livraisons passées |
| `/(app)/earnings` | Gains et paiements |
| `/(app)/profile` | Profil, documents, paramètres |

### 6.4 Écrans Détaillés

#### A. Login Screen (`/(auth)/login`)
- Logo PSR Driver
- Input téléphone (format Congo +242)
- Input mot de passe
- Bouton Se connecter
- Lien Mot de passe oublié

#### B. Dashboard / Home (`/(app)/index`)
- Header avec nom du livreur et statut (En ligne / Hors ligne)
- Carte mission en cours (si active) : Grossiste → Pharmacie, distance, statut
- Bouton Voir l'itinéraire → ouvre Google Maps / Waze
- Stats rapides : livraisons aujourd'hui, gains
- Liste des 3 dernières missions

#### C. Mission Detail (`/(app)/missions/[id]`)
- Numéro de mission
- Grossiste : nom, adresse, téléphone
- Pharmacie : nom, adresse, téléphone
- Produit : nom, quantité
- Distance estimée
- Montant de la course
- Bouton `[ ACCEPTER LA MISSION ]` ou `[ REFUSER ]`

#### D. Mission Active / Stepper (`/(app)/missions/current`)
- Étape 1 : `[ J'accepte la mission ]`
- Étape 2 : `[ Je suis arrivé chez le grossiste ]`
- Étape 3 : `[ Produit récupéré ]` + photo obligatoire
- Étape 4 : `[ En route vers la pharmacie ]` → ouvre GPS externe
- Étape 5 : `[ Je suis arrivé à la pharmacie ]`
- Étape 6 : `[ Livraison confirmée ]` → saisie code OTP

#### E. OTP Confirmation
- Input 4 chiffres (code généré par le système, communiqué à la pharmacie)
- Bouton `[ Confirmer la livraison ]`
- Si code correct : mission COMPLETED, notification envoyée
- Si code incorrect : message d'erreur, 3 tentatives max

### 6.5 Notifications Push (Firebase Cloud Messaging)

| Type de notification | Contenu |
|----------------------|---------|
| `NOUVELLE_MISSION` | Nouvelle course disponible |
| `MISSION_ASSIGNED` | Mission assignée : Grossiste X → Pharmacie Y |
| `MISSION_CANCELLED` | La mission a été annulée |
| `RAPPEL_PHARMACIE` | La pharmacie ABC attend votre livraison |
| `PAIEMENT_CONFIRME` | Paiement de votre course confirmé |
| `SYSTEM` | Information importante |

### 6.6 GPS et Navigation Externe

PSR Driver n'intègre **PAS** de carte Google Maps. À la place, elle ouvre l'application GPS native du téléphone avec les coordonnées pré-remplies.

```typescript
const openNavigation = (latitude: number, longitude: number, label: string) => {
  const url = Platform.select({
    ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
  });
  Linking.openURL(url);
};
```

### 6.7 Preuve de Livraison

- **Code OTP** à 4 chiffres (MVP) — généré par le backend, envoyé à la pharmacie via notification
- **Photo du produit remis** (expo-camera) — upload vers Supabase Storage
- **Signature numérique** (Phase 2) — react-native-signature-canvas
- **QR Code de scan** (Phase 2) — expo-barcode-scanner

---

## 7. Dashboard Entreprise de Livraison (Angular)

L'entreprise de livraison possède son propre portail web Angular. Elle ne gère **PAS** les livreurs via PSR — elle gère ses propres livreurs et les assigne aux missions que PSR lui confie.

### 7.1 Fonctionnalités du Dashboard Entreprise

- Réception des missions de livraison envoyées par PSR
- Acceptation ou refus d'une mission
- Assignation d'une mission à un livreur spécifique (parmi ses livreurs enregistrés)
- Suivi en temps réel du statut des missions (via polling ou WebSocket)
- Gestion des livreurs : ajout, modification, désactivation, documents
- Historique complet des missions effectuées
- Statistiques : nombre de missions, montants, performance par livreur
- Profil et paramètres de l'entreprise

### 7.2 Workflow Entreprise de Livraison

```
PSR (Commande confirmée)
        |
        | Création mission
        v
Entreprise Livraison (Dashboard)
        |
        | Réception notification
        v
[ Accepter la mission ]
        |
        v
[ Assigner à un livreur ]
        |
        | Notification push FCM
        v
Livreur (App Mobile)
        |
        | Accepte -> Récupère -> Livre -> OTP
        v
Entreprise Livraison (Dashboard)
        |
        | Mission COMPLETED
        v
[ Paiement reçu de PSR ]
        |
        v
Entreprise rémunère son livreur (hors PSR)
```

### 7.3 Écrans du Dashboard Entreprise

#### A. Dashboard
- KPIs : missions en cours, missions du jour, missions du mois, chiffre d'affaires
- Graphique simple (barres) : missions par semaine
- Liste des 5 dernières missions
- Alertes : livreurs hors ligne, missions en retard

#### B. Missions
- Onglet **'Nouvelles'** : missions à accepter/refuser
- Onglet **'En cours'** : missions assignées à des livreurs, suivi statut
- Onglet **'Terminées'** : historique
- Carte mission : référence, grossiste, pharmacie, produit, distance, montant, statut
- Action 'Accepter' → 'Assigner à un livreur' → dropdown liste livreurs disponibles

#### C. Livreurs (Agents)
- Liste des livreurs : nom, téléphone, statut (disponible/en course/hors ligne)
- Bouton 'Ajouter un livreur' : formulaire (nom, téléphone, email, mot de passe)
- Édition livreur : modifier infos, activer/désactiver
- Détail livreur : missions effectuées, gains, notes
- Documents : permis, pièce d'identité (upload)

#### D. Historique
- Tableau filtrable : date, référence, grossiste, pharmacie, livreur, montant, statut
- Export CSV (Phase 2)

#### E. Profil
- Nom de l'entreprise, contact, téléphone, email, adresse
- Documents juridiques (registre commerce, etc.)
- Compte bancaire / Mobile Money pour les paiements

### 7.4 Modèle de Paiement Entreprise

PSR paie l'**ENTREPRISE** de livraison. C'est l'entreprise qui gère ensuite la rémunération de **SES** livreurs.

**Exemple :**
```
Mission livraison : 1 000 FCFA
        |
        v
PSR paie l'entreprise : 1 000 FCFA
        |
        v
Entreprise de livraison (interne)
        |
        |---> 700 FCFA -> Livreur Jean
        |---> 300 FCFA -> Marge entreprise
```

- PSR ne gère **PAS** la répartition interne.
- PSR ne connaît **PAS** le salaire du livreur.
- L'entreprise reste responsable de ses livreurs.

---

## 8. Modèle de Données (PostgreSQL + Prisma)

Schéma Prisma complet. Chaque table inclut `createdAt` et `updatedAt`.

### 8.1 Schéma Prisma

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

// UTILISATEURS & ROLES
model User {
  id String @id @default(uuid()) email String @unique password String
  firstName String lastName String phone String? role Role @default(PHARMACY_USER)
  isActive Boolean @default(true) lastLoginAt DateTime?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  pharmacy Pharmacy? @relation(fields: [pharmacyId], references: [id])
  pharmacyId String? wholesaler Wholesaler? @relation(fields: [wholesalerId], references: [id])
  wholesalerId String? deliveryCompany DeliveryCompany? @relation(fields: [deliveryCompanyId], references: [id])
  deliveryCompanyId String? deliveryAgent DeliveryAgent? @relation(fields: [deliveryAgentId], references: [id])
  deliveryAgentId String? auditLogs AuditLog[] notifications Notification[]
}

enum Role { SUPER_ADMIN PHARMACY_ADMIN PHARMACY_USER WHOLESALER_ADMIN WHOLESALER_USER DELIVERY_ADMIN DELIVERY_USER DRIVER }

// PHARMACIES
model Pharmacy {
  id String @id @default(uuid()) name String registration String @unique
  address String city String @default("Brazzaville") phone String email String
  contactName String isVerified Boolean @default(false) isActive Boolean @default(true)
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  users User[] requests Request[] orders Order[] subscription Subscription?
}

// GROSSISTES
model Wholesaler {
  id String @id @default(uuid()) name String registration String @unique
  address String city String @default("Brazzaville") phone String email String
  contactName String isVerified Boolean @default(false) isActive Boolean @default(true)
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  users User[] requestsFound Request[] @relation("FoundBy") orders Order[]
}

// ENTREPRISES DE LIVRAISON
model DeliveryCompany {
  id String @id @default(uuid()) name String phone String email String
  contactName String address String? city String @default("Brazzaville")
  paymentPhone String? isVerified Boolean @default(false) isActive Boolean @default(true)
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  users User[] agents DeliveryAgent[] deliveries Delivery[]
}

// LIVREURS (AGENTS)
model DeliveryAgent {
  id String @id @default(uuid()) firstName String lastName String
  phone String @unique email String? licenseNumber String? idCardNumber String?
  isActive Boolean @default(true) isOnline Boolean @default(false)
  currentLatitude Float? currentLongitude Float? fcmToken String?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  deliveryCompany DeliveryCompany @relation(fields: [deliveryCompanyId], references: [id])
  deliveryCompanyId String user User? deliveries Delivery[]
}

// DEMANDES (REQUESTS)
model Request {
  id String @id @default(uuid()) reference String @unique
  pharmacyId String pharmacy Pharmacy @relation(fields: [pharmacyId], references: [id])
  productName String quantity Int notes String?
  status RequestStatus @default(SEARCHING) foundById String?
  foundBy Wholesaler? @relation("FoundBy", fields: [foundById], references: [id])
  foundAt DateTime? expiresAt DateTime cancelledAt DateTime? cancelReason String?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  order Order? responses RequestResponse[]
}

enum RequestStatus { SEARCHING FOUND NOT_FOUND EXPIRED CANCELLED }

// REPONSES GROSSISTES
model RequestResponse {
  id String @id @default(uuid()) requestId String
  request Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
  wholesalerId String responseType ResponseType respondedAt DateTime @default(now())
}

enum ResponseType { VIEWED CONFIRMED DECLINED }

// COMMANDES
model Order {
  id String @id @default(uuid()) reference String @unique requestId String @unique
  request Request @relation(fields: [requestId], references: [id])
  pharmacyId String pharmacy Pharmacy @relation(fields: [pharmacyId], references: [id])
  wholesalerId String wholesaler Wholesaler @relation(fields: [wholesalerId], references: [id])
  productAmount Decimal @db.Decimal(12, 2) deliveryAmount Decimal @db.Decimal(12, 2)
  commissionAmount Decimal @default(0.00) @db.Decimal(12, 2) totalAmount Decimal @db.Decimal(12, 2)
  paymentStatus PaymentStatus @default(PENDING) deliveryStatus DeliveryStatus @default(PENDING)
  orderStatus OrderStatus @default(CREATED) otpCode String? @db.VarChar(4) otpVerifiedAt DateTime?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt delivery Delivery? payment Payment?
}

enum PaymentStatus { PENDING CONFIRMED FAILED }
enum DeliveryStatus { PENDING ASSIGNED ACCEPTED PICKED_UP IN_TRANSIT DELIVERED FAILED }
enum OrderStatus { CREATED CONFIRMED IN_PROGRESS DELIVERED COMPLETED CANCELLED }

// LIVRAISONS
model Delivery {
  id String @id @default(uuid()) orderId String @unique
  order Order @relation(fields: [orderId], references: [id])
  deliveryCompanyId String deliveryCompany DeliveryCompany @relation(fields: [deliveryCompanyId], references: [id])
  deliveryAgentId String? deliveryAgent DeliveryAgent? @relation(fields: [deliveryAgentId], references: [id])
  assignedAt DateTime? acceptedAt DateTime? pickedUpAt DateTime? deliveredAt DateTime?
  deliveryNotes String? proofPhotoUrl String? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
}

// PAIEMENTS
model Payment {
  id String @id @default(uuid()) orderId String @unique
  order Order @relation(fields: [orderId], references: [id])
  amount Decimal @db.Decimal(12, 2) method String @default("MANUAL")
  status PaymentStatus @default(PENDING) paidAt DateTime? notes String?
  createdAt DateTime @default(now())
}

// COMMISSIONS
model CommissionRule {
  id String @id @default(uuid()) ruleName String
  percentage Decimal @db.Decimal(5, 2) isActive Boolean @default(true)
  effectiveDate DateTime createdAt DateTime @default(now())
}

// ABONNEMENTS
model Subscription {
  id String @id @default(uuid()) pharmacyId String @unique
  pharmacy Pharmacy @relation(fields: [pharmacyId], references: [id])
  plan String @default("BASIC") price Decimal @db.Decimal(12, 2)
  startDate DateTime endDate DateTime status SubscriptionStatus @default(ACTIVE)
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
}

enum SubscriptionStatus { ACTIVE EXPIRED CANCELLED SUSPENDED }

// NOTIFICATIONS
model Notification {
  id String @id @default(uuid()) userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  title String message String type String isRead Boolean @default(false)
  createdAt DateTime @default(now())
}

// JOURNAL D'AUDIT
model AuditLog {
  id String @id @default(uuid()) userId String?
  user User? @relation(fields: [userId], references: [id])
  action String entityType String entityId String? details Json?
  ipAddress String? createdAt DateTime @default(now())
}
```

---

## 9. API REST — Spécification Complète

Toutes les API retournent du JSON. Le format d'erreur standard est :
```json
{ "success": false, "message": "...", "errors": [...] }
```

### 9.1 Auth

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/auth/register` | Public | Inscription (email, password, firstName, lastName, role) |
| `POST /api/auth/login` | Public | Connexion (email, password) → JWT access + refresh |
| `POST /api/auth/refresh` | Public | Refresh token → nouveau access token |
| `POST /api/auth/forgot-password` | Public | Demande réinitialisation → email envoyé |
| `POST /api/auth/reset-password` | Public | Réinitialisation (token, newPassword) |
| `GET /api/auth/me` | Authentifié | Profil utilisateur connecté |
| `POST /api/auth/logout` | Authentifié | Déconnexion, invalidation refresh token |

### 9.2 Pharmacies

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/pharmacies` | `SUPER_ADMIN` | Créer une pharmacie |
| `GET /api/pharmacies` | `SUPER_ADMIN` | Lister toutes les pharmacies |
| `GET /api/pharmacies/:id` | `SUPER_ADMIN` / Propriétaire | Détail pharmacie |
| `PATCH /api/pharmacies/:id` | `SUPER_ADMIN` / Propriétaire | Modifier pharmacie |
| `PATCH /api/pharmacies/:id/verify` | `SUPER_ADMIN` | Valider la pharmacie |
| `PATCH /api/pharmacies/:id/activate` | `SUPER_ADMIN` | Activer / désactiver |

### 9.3 Grossistes

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/wholesalers` | `SUPER_ADMIN` | Créer un grossiste |
| `GET /api/wholesalers` | Authentifié | Lister les grossistes actifs |
| `GET /api/wholesalers/:id` | `SUPER_ADMIN` / Propriétaire | Détail grossiste |
| `PATCH /api/wholesalers/:id/verify` | `SUPER_ADMIN` | Valider le grossiste |

### 9.4 Entreprises de Livraison

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/delivery-companies` | `SUPER_ADMIN` | Créer une entreprise de livraison |
| `GET /api/delivery-companies` | `SUPER_ADMIN` | Lister les entreprises |
| `GET /api/delivery-companies/:id` | `SUPER_ADMIN` / Propriétaire | Détail entreprise |
| `PATCH /api/delivery-companies/:id/verify` | `SUPER_ADMIN` | Valider l'entreprise |

### 9.5 Livreurs (Agents)

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/delivery-agents` | `DELIVERY_ADMIN` | Ajouter un livreur |
| `GET /api/delivery-agents` | `DELIVERY_ADMIN` | Lister les livreurs de l'entreprise |
| `GET /api/delivery-agents/:id` | `DELIVERY_ADMIN` | Détail livreur |
| `PATCH /api/delivery-agents/:id` | `DELIVERY_ADMIN` | Modifier livreur |
| `PATCH /api/delivery-agents/:id/toggle` | `DELIVERY_ADMIN` | Activer / désactiver livreur |
| `POST /api/delivery-agents/:id/fcm-token` | `DRIVER` | Enregistrer token FCM |

### 9.6 Demandes (Requests) — Cœur du Système

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `POST /api/requests` | `PHARMACY_*` | Créer une demande (productName, quantity, notes) |
| `GET /api/requests` | `PHARMACY_*` | Lister les demandes de la pharmacie |
| `GET /api/requests/:id` | `PHARMACY_*` | Détail d'une demande |
| `PATCH /api/requests/:id/cancel` | `PHARMACY_*` | Annuler une demande (SEARCHING uniquement) |
| `GET /api/wholesaler/requests` | `WHOLESALER_*` | Voir les demandes en cours (SEARCHING) |
| `POST /api/wholesaler/requests/:id/confirm` | `WHOLESALER_*` | **CONFIRMER** disponibilité (FCFS lock) |
| `POST /api/wholesaler/requests/:id/decline` | `WHOLESALER_*` | Refuser une demande |

### 9.7 Commandes (Orders)

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `GET /api/orders` | Authentifié | Lister les commandes (filtrées par rôle) |
| `GET /api/orders/:id` | Authentifié | Détail d'une commande |
| `POST /api/orders/:id/confirm-payment` | `PHARMACY_ADMIN` | Confirmer paiement manuel (MVP) |
| `PATCH /api/orders/:id/cancel` | `PHARMACY_ADMIN` / `SUPER_ADMIN` | Annuler une commande |

### 9.8 Livraisons (Deliveries)

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `GET /api/deliveries` | Authentifié | Lister les livraisons (filtrées par rôle) |
| `GET /api/deliveries/:id` | Authentifié | Détail d'une livraison |
| `POST /api/deliveries/:id/assign` | `DELIVERY_ADMIN` | Assigner un livreur à la mission |
| `POST /api/deliveries/:id/accept` | `DRIVER` | Livreur accepte la mission |
| `PATCH /api/deliveries/:id/status` | `DRIVER` | Mise à jour statut (ACCEPTED, PICKED_UP, IN_TRANSIT, DELIVERED) |
| `POST /api/deliveries/:id/verify-otp` | `DRIVER` | Vérifier code OTP (4 chiffres) |
| `POST /api/deliveries/:id/proof` | `DRIVER` | Upload photo de preuve |

### 9.9 Notifications

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `GET /api/notifications` | Authentifié | Lister les notifications de l'utilisateur |
| `PATCH /api/notifications/:id/read` | Authentifié | Marquer comme lu |
| `PATCH /api/notifications/read-all` | Authentifié | Tout marquer comme lu |

### 9.10 Admin

| Endpoint | Accès | Description |
|----------|-------|-------------|
| `GET /api/admin/statistics` | `SUPER_ADMIN` | Statistiques globales (dashboard) |
| `GET /api/admin/audit-logs` | `SUPER_ADMIN` | Journal d'audit (filtrable) |
| `GET /api/admin/commissions` | `SUPER_ADMIN` | Lister les règles de commission |
| `POST /api/admin/commissions` | `SUPER_ADMIN` | Créer une règle de commission |
| `PATCH /api/admin/commissions/:id` | `SUPER_ADMIN` | Modifier une règle |
| `GET /api/admin/reports` | `SUPER_ADMIN` | Rapports (commandes, revenus, etc.) |

---

## 10. Workflows Métier Détaillés

### 10.1 Workflow A : Création Demande → FCFS

```
Pharmacie crée demande (POST /api/requests)
        |
        v
Backend : INSERT Request (status=SEARCHING, expiresAt=NOW+30min)
        |
        v
Notification push FCM à tous les grossistes actifs
        |
        v
Grossiste A ouvre dashboard -> voit demande -> clique "J'ai ce produit"
        |
        v
Backend transaction SQL :
  UPDATE Request SET status='FOUND', foundById=A WHERE status='SEARCHING'
  IF rowCount=0 -> 409 "Deja prise"
  ELSE -> CREATE Order + CREATE Notification pharmacie
        |
        v
Grossiste A voit "Commande confirmee"
Grossiste B voit "Demande deja traitee" (grisee)
```

### 10.2 Workflow B : Livraison avec OTP

```
Commande creee (paymentStatus=PENDING)
        |
        v
Admin/Pharmacie confirme paiement manuel
        |
        v
Backend : CREATE Delivery (status=PENDING) + Notification entreprise livraison
        |
        v
Entreprise Livraison (Web) : Accepte mission + Assigne a Livreur Jean
        |
        v
Backend : UPDATE Delivery SET status=ASSIGNED, agentId=Jean
        |
        v
Push FCM a Jean : "Nouvelle mission assignee"
        |
        v
Jean (App) : Accepte -> status=ACCEPTED
        |
        v
Jean : "Arrive chez grossiste" -> status=PICKED_UP + photo
        |
        v
Jean : "En route" -> status=IN_TRANSIT (ouvre GPS externe)
        |
        v
Jean : "Arrive pharmacie" -> status=DELIVERED
        |
        v
Jean : Saisit OTP (4 chiffres affiches sur dashboard pharmacie)
        |
        v
Backend verifie OTP -> Si correct : status=COMPLETED + Order COMPLETED
```

### 10.3 Workflow C : Commission Configurable

**Lancement (Mois 0-6) :**
```
CommissionRule { ruleName: 'product', percentage: 0.00, isActive: true }
-> totalAmount = productAmount + deliveryAmount
```

**Phase 2 (Mois 6+) :**
```
CommissionRule { ruleName: 'product', percentage: 2.00, isActive: true }
-> commissionAmount = productAmount * 0.02
-> totalAmount = productAmount + deliveryAmount + commissionAmount
```

Le backend récupère **TOUJOURS** la règle active la plus récente. Aucun redéploiement de code nécessaire.

### 10.4 Workflow D : Gestion des Livreurs par Entreprise

```
Entreprise de livraison s'inscrit sur PSR
        |
        v
Admin PSR valide l'entreprise
        |
        v
Entreprise cree ses livreurs via dashboard
        |
        v
Chaque livreur recoit identifiants (telephone + mot de passe)
        |
        v
Livreur telecharge PSR Driver (React Native + Expo)
        |
        v
Livreur se connecte -> voit ses missions assignees
        |
        v
Entreprise supervise : missions, statuts, performance
        |
        v
PSR paie l'ENTREPRISE -> entreprise paie ses livreurs
```

---

## 11. Sécurité

- **HTTPS** obligatoire partout (frontend, backend, API)
- **JWT** access token (15 minutes) + refresh token (7 jours) avec rotation
- **Bcrypt** hash des mots de passe (cost factor 12)
- **RBAC** strict : middleware vérifie le rôle à chaque route
- **Rate limiting** : login 5/min, confirm request 10/min, API générale 100/min
- **SQL injection** : requêtes paramétrées Prisma uniquement (pas de raw SQL sauf FCFS)
- **XSS** : échappement automatique Angular + validation Zod côté backend
- **CSRF** : tokens pour les mutations (POST/PATCH/DELETE)
- **Audit logs** : toute action sensible tracée (qui, quoi, quand, IP, détails)
- **Secrets** : variables d'environnement uniquement, jamais dans le code
- **FCM tokens** : stockés sécurisés, rotation si invalide, suppression à la déconnexion
- **Validation des uploads** : type MIME, taille max, scan antivirus (Phase 2)
- **CORS** : whitelist des domaines autorisés uniquement
- **Headers sécurisés** : HSTS, X-Content-Type-Options, X-Frame-Options, CSP

---

## 12. Roadmap de Développement — 70 Étapes

Cette roadmap détaille chaque étape du projet, jour par jour, module par module. Chaque étape est concrète, mesurable et livrable.

### Phase 0 : Fondation (Semaine 1)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 1 | Setup Backend | `psr-backend` | Node.js 20, Express, TypeScript, ESLint, Prettier, structure dossiers |
| 2 | Setup Frontend Web | `psr-frontend` | Angular 22, TailwindCSS, structure features, routing lazy |
| 3 | Setup Mobile | `psr-driver` | Expo SDK 51, React Native, NativeWind, Expo Router, Zustand |
| 4 | Base de données | `prisma` | Schéma Prisma complet, migrations initiales, seed data |
| 5 | CI/CD | `.github/workflows` | GitHub Actions : lint, test, build backend + frontend + mobile |
| 6 | Firebase FCM | `config/firebase.ts` | Configuration projet Firebase, clés serveur, test push |
| 7 | Alignement | — | Réunion technique, validation maquettes, confirmation stack |

### Phase 1 : Authentification (Semaine 2)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 8 | Backend Auth | `modules/auth` | Register, login, JWT access/refresh, hash bcrypt, middleware auth |
| 9 | Backend Users | `modules/users` | CRUD users, profils, rôles, middleware RBAC |
| 10 | Frontend Auth Pages | `features/auth` | Login page, Register page, Forgot-password page (Tailwind) |
| 11 | Frontend Guards | `core/guards` | AuthGuard, RoleGuard, NoAuthGuard + interceptors HTTP |
| 12 | Mobile Auth | `app/(auth)` | Login screen livreur, formulaire, validation, persistance token |
| 13 | Tests Auth | `tests/` | Tests unitaires auth, tests intégration login, tests guards |
| 14 | Revue | — | Code review, corrections, documentation API auth |

### Phase 2 : Pharmacies & Grossistes (Semaine 3)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 15 | Backend Pharmacies | `modules/pharmacies` | CRUD, validation registre, statut isVerified |
| 16 | Backend Wholesalers | `modules/wholesalers` | CRUD, validation, liste active, dashboard data |
| 17 | Frontend Pharmacy | `features/pharmacy` | Dashboard, profil, formulaire édition |
| 18 | Frontend Wholesaler | `features/wholesaler` | Dashboard, profil, informations entreprise |
| 19 | Admin Validation | `features/admin` | Pages validation pharmacies/grossistes (accepter/refuser) |
| 20 | Tests | `tests/` | Tests CRUD, validation, accès RBAC |
| 21 | Revue | — | Corrections, optimisation requêtes, index PostgreSQL |

### Phase 3 : Demandes & FCFS (Semaine 4) — Cœur du Système

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 22 | Backend Request Model | `modules/requests` | Modèle Prisma, création, validation Zod, génération référence REQ-XXXX |
| 23 | Backend FCFS Lock | `modules/requests` | Verrouillage SQL atomique `UPDATE ... WHERE status='SEARCHING'` |
| 24 | Backend Request Lifecycle | `modules/requests` | Expiration 30min (cron job), annulation, statuts |
| 25 | Frontend Request Create | `features/pharmacy/requests` | Formulaire création demande (produit, quantité, notes) |
| 26 | Frontend Request List | `features/pharmacy/requests` | Liste demandes, badges statut, détail, compte à rebours |
| 27 | Frontend Wholesaler Requests | `features/wholesaler/requests` | Dashboard temps réel, carte demande, bouton 'J'ai ce produit' |
| 28 | Frontend FCFS Feedback | `features/wholesaler/requests` | Gestion double-clic, animation 'Déjà prise', toast succès/erreur |
| 29 | Tests FCFS | `tests/integration` | Tests concurrence : 2 grossistes simultanés, un seul gagne |
| 30 | Revue | — | Optimisation transaction, index SQL, corrections race conditions |

### Phase 4 : Commandes (Semaine 5)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 31 | Backend Orders Create | `modules/orders` | Création auto depuis Request FOUND, génération référence ORD-XXXX |
| 32 | Backend Orders Calcul | `modules/orders` | Montants (produit + livraison), commission 0%, total |
| 33 | Frontend Pharmacy Orders | `features/pharmacy/orders` | Liste commandes, détail, statuts, bouton 'Confirmer paiement' |
| 34 | Frontend Wholesaler Orders | `features/wholesaler/orders` | Liste commandes à préparer, détail produit |
| 35 | Frontend Admin Orders | `features/admin/orders` | Tableau global commandes, filtres, recherche |
| 36 | Tests Orders | `tests/` | Tests création, calculs, statuts, transitions |
| 37 | Revue | — | Corrections, validation montants |

### Phase 5 : Entreprises Livraison & Livreurs (Semaine 6)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 38 | Backend DeliveryCompanies | `modules/delivery-companies` | CRUD entreprises, validation, paymentPhone, isVerified |
| 39 | Backend DeliveryAgents | `modules/delivery-agents` | CRUD livreurs, lien entreprise, fcmToken, isOnline, currentLocation |
| 40 | Frontend DeliveryCompany Dashboard | `features/delivery-company` | Dashboard KPI, missions en cours, stats, graphiques |
| 41 | Frontend DeliveryCompany Management | `features/delivery-company/agents` | Liste livreurs, ajout, assignation mission, statuts |
| 42 | Mobile Livreur Auth | `app/(auth)` | Login livreur, persistance token (secure-store), validation |
| 43 | Mobile Livreur Dashboard | `app/(app)/index` | Dashboard missions, statut en ligne/hors ligne, stats rapides |
| 44 | Tests | `tests/` | Tests CRUD agents, liens entreprise, accès RBAC |
| 45 | Revue | — | Corrections, validation mobile |

### Phase 6 : Livraison & OTP (Semaine 7)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 46 | Backend Deliveries | `modules/deliveries` | Création mission, statuts PENDING→ASSIGNED→ACCEPTED→PICKED_UP→IN_TRANSIT→DELIVERED |
| 47 | Backend Assign & Notify | `modules/deliveries` | Assignation agent, notifications FCM push, WebSocket dashboard |
| 48 | Backend OTP | `modules/deliveries` | Génération code 4 chiffres, vérification, 3 tentatives max, expiration |
| 49 | Mobile Mission Active | `app/(app)/missions/current` | Stepper 6 étapes : Accepter → Arrive grossiste → Récupère → En route → Arrive pharmacie → OTP |
| 50 | Mobile GPS & Photo | `app/(app)/missions/current` | Lien GPS externe (Google Maps), photo preuve (expo-camera), upload Supabase |
| 51 | Mobile OTP | `components/mission/OTPInput.tsx` | Saisie code 4 chiffres, vérification API, confirmation livraison |
| 52 | Frontend Pharmacy OTP | `features/pharmacy/deliveries` | Affichage code OTP à communiquer, bouton 'Produit reçu', confirmation |
| 53 | Tests E2E Livraison | `tests/e2e` | Scénario complet : demande → commande → livraison → OTP → COMPLETED |
| 54 | Revue | — | Corrections, optimisation photos, validation GPS |

### Phase 7 : Notifications & Admin (Semaine 8)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 55 | Backend Notifications | `modules/notifications` | Notifications internes (dashboard) + push FCM (mobile), typage |
| 56 | Frontend Notifications | `core/services/notification.service` | Badge, liste notifications, toast temps réel, marquer lu |
| 57 | Mobile Push | `hooks/useNotifications.ts` | Réception push FCM, navigation auto vers mission, badge |
| 58 | Admin Dashboard | `features/admin/dashboard` | Stats globales : commandes, pharmacies, CA, graphiques simples |
| 59 | Admin Commissions | `features/admin/commissions` | Formulaire création règle, historique, activation/désactivation |
| 60 | Admin Reports | `features/admin/reports` | Tableaux récapitulatifs, filtres date, export CSV |
| 61 | Tests Notifications | `tests/` | Tests push, badge, marquer lu, FCM |
| 62 | Revue | — | Corrections, optimisation requêtes |

### Phase 8 : Polish & Déploiement (Semaine 9-10)

| Étape | Tâche | Module | Détails |
|-------|-------|--------|---------|
| 63 | Tests Globaux | `tests/` | E2E complet, tests charge (100 requêtes FCFS simultanées), sécurité, pénétration |
| 64 | Corrections | — | Bug fixes, optimisation requêtes N+1, index manquants, memory leaks |
| 65 | Déploiement Backend | Railway/Render | Déploiement API, variables env, SSL, domaine custom api.psr.cg |
| 66 | Déploiement Frontend Web | Vercel | Build production, domaine app.psr.cg, HTTPS, cache, compression |
| 67 | Déploiement Mobile | EAS Build | Build Android APK/AAB, Play Console Internal Testing, iOS TestFlight |
| 68 | Infrastructure | — | Domaine psr.cg, certificats SSL, monitoring Sentry, UptimeRobot, backups auto |
| 69 | Documentation | `docs/` | Guide utilisateur pharmacie, guide grossiste, guide livreur, guide admin, API docs |
| 70 | Lancement Beta | — | 5 pharmacies, 3 grossistes, 1 entreprise livraison, 3 livreurs, collecte feedback |

---

## 13. Déploiement & Infrastructure

### 13.1 Environnements

| Environnement | URL Backend | URL Frontend | Usage |
|---------------|-------------|--------------|-------|
| Development | `localhost:3000` | `localhost:4200` | Développement local |
| Staging | `staging-api.psr.cg` | `staging.psr.cg` | Tests internes, recette |
| Production | `api.psr.cg` | `app.psr.cg` | Production live |

### 13.2 Checklist Déploiement

- Variables d'environnement configurées (`.env.production`)
- Base de données PostgreSQL provisionnée (Supabase / Railway)
- Migrations Prisma exécutées en production
- Firebase FCM clés serveur configurées
- Certificats SSL valides (Let's Encrypt)
- Rate limiting activé
- Sentry configuré (monitoring erreurs)
- Backups PostgreSQL automatisés (quotidiens)
- Mobile : EAS Build configuré, `app.json` valide

### 13.3 Architecture de Déploiement

```
                         PRODUCTION
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   Vercel (Web)         Railway (API)       Supabase (DB)
   app.psr.cg           api.psr.cg          PostgreSQL
        |                     |                     |
        |                     |                     v
        |                     |              Supabase Storage
        |                     |                     |
        |                     v                     v
        |              Firebase FCM           Backups auto
        |                     |
        v                     v
   CDN + Cache         Monitoring Sentry
                              |
                              v
                       UptimeRobot
```

### 13.4 Sécurité Production

- HTTPS forcé sur toutes les routes
- CORS whitelist : `app.psr.cg`, `staging.psr.cg` uniquement
- Rate limiting agressif : 100 req/min par IP, 5 login/min
- JWT secrets différents par environnement
- Database URL en variable d'environnement uniquement
- Pas de logs sensibles (passwords, tokens) en production
- Sentry activé pour toutes les exceptions non gérées
- Backups PostgreSQL quotidiens automatisés (rétention 30 jours)

### 13.5 Maintenance Post-Lancement

- **Monitoring Sentry** : alertes Slack/Email si erreurs > 10/h
- **UptimeRobot** : ping toutes les 5 minutes, alerte si down > 2 min
- **Mises à jour de sécurité** : Dependabot + revue mensuelle
- **Migrations Prisma** : testées en staging avant production
- **Mobile** : mises à jour OTA via Expo Updates (pas de store pour les patchs)
- **Collecte feedback beta** : formulaire hebdomadaire, entretiens utilisateurs

---

## Conclusion

Ce TRD et Roadmap constituent la référence complète pour le développement de **Pharmacie Sans Rupture (PSR) / PharmaFlow**.

Le projet est structuré en 4 produits distincts (Web, Mobile, Backend, Database) avec une séparation claire des responsabilités.

Le mécanisme **First-Come-First-Served** avec verrouillage SQL est le cœur technique du système. Il garantit l'intégrité des commandes sans API externe chez les grossistes.

L'écosystème des entreprises de livraison est intégré de manière propre : PSR paie l'entreprise, l'entreprise gère ses livreurs, les livreurs utilisent l'app mobile dédiée.

La roadmap de **70 étapes** couvre **10 semaines** de développement intensif, de la fondation au lancement beta, avec des jalons clairs et des livrables mesurables à chaque étape.

**Prochaine étape recommandée** : démarrer la Phase 0 (Fondation) et valider le schéma Prisma avec les partenaires grossistes et entreprises de livraison de Brazzaville.