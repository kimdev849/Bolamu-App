# 🏥 Bolamu API — Documentation Complète

> **PSR PharmaFlow** — Plateforme B2B de mise en relation pharmacie ↔ grossiste ↔ livraison médicale

---

## 📋 Sommaire

1. [Informations générales](#-informations-générales)
2. [Authentification](#-authentification)
3. [Comptes de test](#-comptes-de-test)
4. [Endpoints — Auth](#-auth)
5. [Endpoints — Admin](#-admin)
6. [Endpoints — Pharmacies](#-pharmacies)
7. [Endpoints — Grossistes](#-grossistes)
8. [Endpoints — Entreprises de livraison](#-entreprises-de-livraison)
9. [Endpoints — Demandes (FCFS)](#-demandes)
10. [Endpoints — Commandes](#-commandes)
11. [Modèle de données (Prisma)](#-modèle-de-données)
12. [Codes d'erreur](#-codes-derreur)
13. [Schémas de réponse](#-schémas-de-réponse)

---

## 🚀 Informations générales

| Propriété | Valeur |
|-----------|--------|
| **Base URL** | `http://localhost:3000/api` |
| **Version** | `1.0.0` |
| **Format des réponses** | JSON |
| **Encodage** | UTF-8 |
| **Devise** | FCFA (franc CFA) |
| **CORS** | Autorise `localhost:4200`, `localhost:60453`, `127.0.0.1:4200` |

### Format de réponse standard

**Succès :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Action réussie",
  "pagination": {  // Optionnel, pour les listes
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Erreur :**
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

### Headers requis

Pour les endpoints authentifiés :
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 🔐 Authentification

L'API utilise **JWT (JSON Web Tokens)** pour l'authentification.

| Type | Durée |
|------|-------|
| `accessToken` | 7 jours (configurable via `JWT_EXPIRES_IN`) |
| `refreshToken` | 30 jours (configurable via `JWT_REFRESH_EXPIRES_IN`) |

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `admin` | Administrateur PSR — accès total |
| `pharmacy` | Pharmacie — création de demandes, suivi commandes |
| `wholesaler` | Grossiste — acceptation FCFS, traitement commandes |
| `delivery_company` | Entreprise de livraison — gestion livreurs et missions |

> 💡 **Rappel** : Aucun utilisateur ne s'inscrit librement. Tous les comptes professionnels sont créés par l'admin PSR après vérification KYC (voir flow onboarding).

---

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| 🛡️ **Admin PSR** | `admin@psr.com` | `Admin@123` |
| 💊 **Pharmacie** | `pharmacie@test.com` | `Pharma@123` |
| 💊 **Pharmacie 2** | `pharmacie2@test.com` | `Pharma@123` |
| 💊 **Pharmacie 3** | `pharmacie3@test.com` | `Pharma@123` |
| 📦 **Grossiste** | `grossiste@test.com` | `Wholesaler@123` |
| 📦 **Grossiste 2** | `grossiste2@test.com` | `Wholesaler@123` |
| 📦 **Grossiste 3** | `grossiste3@test.com` | `Wholesaler@123` |
| 🚚 **Livraison** | `livreur@test.com` | `Delivery@123` |
| 🚚 **Livraison 2** | `livreur2@test.com` | `Delivery@123` |

---

## 📡 Auth

### `POST /api/auth/login` 🔓 Publique

Connexion utilisateur.

**Body :**
```json
{
  "email": "pharmacie@test.com",
  "password": "Pharma@123"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "clsx...",
      "email": "pharmacie@test.com",
      "firstName": "Jean",
      "lastName": "Mbiock",
      "phone": "+237698765432",
      "role": "pharmacy",
      "avatar": null,
      "isActive": true,
      "profile": {
        "id": "clsy...",
        "name": "Pharmacie Centrale",
        "logo": null
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 400 | `Email et mot de passe requis` |
| 401 | `Email ou mot de passe incorrect` |
| 403 | `Compte désactivé. Contactez l'administrateur.` |

---

### `GET /api/auth/me` 🔒 Authentifié

Récupère le profil de l'utilisateur connecté, avec son profil lié (pharmacie, grossiste ou entreprise de livraison).

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "clsx...",
    "email": "pharmacie@test.com",
    "firstName": "Jean",
    "lastName": "Mbiock",
    "phone": "+237698765432",
    "role": "pharmacy",
    "avatar": null,
    "isActive": true,
    "createdAt": "2025-07-25T12:00:00.000Z",
    "profile": {
      "id": "clsy...",
      "name": "Pharmacie Centrale",
      "logo": null,
      "city": "Douala",
      "isVerified": true
    }
  }
}
```

---

### `POST /api/auth/change-password` 🔒 Authentifié

Change le mot de passe de l'utilisateur connecté.

**Body :**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Contraintes :**
- `newPassword` ≥ 6 caractères

**Réponse (200) :** `{ "success": true, "message": "Mot de passe changé avec succès" }`

---

## 🛡️ Admin

Tous les endpoints admin requièrent le rôle `admin`.

### `GET /api/admin/stats`

Dashboard — statistiques globales.

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "totalPharmacies": 3,
    "activePharmacies": 3,
    "totalWholesalers": 4,
    "totalDeliveryCompanies": 2,
    "totalOrders": 3,
    "pendingOrders": 2,
    "totalRequests": 8,
    "pendingRequests": 4,
    "totalOnboarding": 5,
    "pendingOnboarding": 3
  }
}
```

---

### `GET /api/admin/pharmacies`

Liste paginée des pharmacies.

**Query params :** `?page=1&limit=10`

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "clsy...",
      "name": "Pharmacie Centrale",
      "email": "contact@pharmacie-centrale.cm",
      "phone": "+237612345001",
      "address": "123 Rue Principale",
      "city": "Douala",
      "region": "Littoral",
      "licenseNumber": "LIC-2024-001",
      "pharmacistInCharge": "Dr. Jean Mbiock",
      "isVerified": true,
      "isActive": true,
      "subscriptionStatus": "active",
      "logo": null,
      "createdAt": "2025-07-25T12:00:00.000Z",
      "user": {
        "email": "pharmacie@test.com",
        "isActive": true
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `GET /api/admin/pharmacies/:id`

Détail d'une pharmacie avec ses dernières demandes et commandes.

---

### `GET /api/admin/wholesalers`

Liste paginée des grossistes. Même structure que `/pharmacies`.

---

### `GET /api/admin/delivery-companies`

Liste paginée des entreprises de livraison, incluant le nombre de livreurs (`_count.agents`).

---

### `GET /api/admin/onboarding`

Liste paginée des demandes d'accès.

**Query params :** `?status=pending|approved|rejected`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "clsz...",
      "entityType": "pharmacy",
      "entityName": "Pharmacie Saint Joseph",
      "email": "contact@saintjoseph.cg",
      "phone": "+242055551001",
      "city": "Brazzaville",
      "licenseNumber": "LIC-2025-010",
      "documentUrl": null,
      "status": "pending",
      "rejectionReason": null,
      "createdAt": "2025-07-25T12:00:00.000Z",
      "processedBy": null
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /api/admin/onboarding/:id/approve`

✅ Approuve une demande d'accès et crée le compte automatiquement.

**Fonctionnement :**
1. Vérifie que la demande est en statut `pending`
2. Génère un mot de passe temporaire (format : `Bolamu@XXXXXX`)
3. Crée l'utilisateur dans `User`
4. Crée le profil lié (`Pharmacy`, `Wholesaler` ou `DeliveryCompany`)
5. Passe la demande en `approved`

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "email": "contact@saintjoseph.cg",
    "tempPassword": "Bolamu@A3F8K2",
    "entityName": "Pharmacie Saint Joseph",
    "entityType": "pharmacy"
  }
}
```

---

### `POST /api/admin/onboarding/:id/reject`

❌ Rejette une demande d'accès.

**Body (optionnel) :**
```json
{
  "reason": "Document de licence non conforme"
}
```

---

### `GET /api/admin/delivery-fees`

Liste des tarifs de livraison par zone.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "clta...",
      "zone": "Douala",
      "standardFee": 1500,
      "expressFee": 2500,
      "thermosFee": 3000
    }
  ]
}
```

### `PUT /api/admin/delivery-fees/:id`

Modifie un tarif de livraison.

**Body (partiel possible) :**
```json
{
  "standardFee": 2000,
  "expressFee": 3000,
  "thermosFee": 3500
}
```

---

## 💊 Pharmacies

### `GET /api/pharmacies/me` 🔒 Pharmacie

Profil de la pharmacie connectée.

**Réponse :** Profil complet avec `user`, `_count.requests`, `_count.orders`.

---

### `PUT /api/pharmacies/me` 🔒 Pharmacie

Met à jour le profil.

**Body (partiel possible) :**
```json
{
  "name": "Pharmacie Centrale",
  "address": "456 Rue du Marché",
  "city": "Douala",
  "region": "Littoral",
  "phone": "+237612345001",
  "pharmacistInCharge": "Dr. Jean Mbiock",
  "logo": "https://..."
}
```

---

### `GET /api/pharmacies/dashboard` 🔒 Pharmacie

Stats du dashboard pharmacie.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRequests": 8,
      "searchingRequests": 2,
      "totalOrders": 3,
      "activeOrders": 1,
      "totalSpent": 67500
    },
    "recentRequests": [ ... ],
    "recentOrders": [ ... ]
  }
}
```

---

## 📦 Grossistes

### `GET /api/wholesalers/me` 🔒 Grossiste

Profil du grossiste connecté avec `_count.orders` et `_count.responses`.

---

### `PUT /api/wholesalers/me` 🔒 Grossiste

Mise à jour du profil (name, address, city, region, phone, logo).

---

### `GET /api/wholesalers/dashboard` 🔒 Grossiste

Stats dashboard grossiste.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalOrders": 3,
      "pendingOrders": 2,
      "totalRevenue": 67500
    }
  }
}
```

---

## 🚚 Entreprises de livraison

### `GET /api/delivery-companies/me` 🔒 Livraison

Profil avec liste des livreurs actifs et `_count.orders`.

---

### `PUT /api/delivery-companies/me` 🔒 Livraison

Mise à jour du profil (name, address, city, region, phone, fleetSize, coverageZones, logo).

---

### `GET /api/delivery-companies/dashboard` 🔒 Livraison

Stats dashboard.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMissions": 1,
      "activeMissions": 0,
      "totalAgents": 5,
      "activeAgents": 4
    }
  }
}
```

---

### `GET /api/delivery-companies/agents` 🔒 Livraison

Liste des livreurs de l'entreprise connectée.

---

### `POST /api/delivery-companies/agents` 🔒 Livraison

Crée un nouveau livreur.

**Body :**
```json
{
  "firstName": "Robert",
  "lastName": "Nkwi",
  "email": "robert@expressmedical.cm",
  "phone": "+237670000001",
  "vehicleType": "motorcycle",
  "vehiclePlate": "LT-001-AB"
}
```

`vehicleType` accepte : `motorcycle`, `car`, `van`, `truck`

---

### `PATCH /api/delivery-companies/agents/:id/toggle` 🔒 Livraison

Active ou désactive un livreur (toggle `isActive`).

---

## 📋 Demandes (FCFS)

> ⚡ **Flux First-Come-First-Served (FCFS)** :
> 1. Pharmacie crée une demande → statut `searching`
> 2. Grossistes voient la demande — premier à accepter gagne
> 3. Le gagnant fixe son prix → demande passe en `found`
> 4. Commande créée automatiquement
> 5. Pharmacie confirme → statut `confirmed`
> 6. Pharmacie paie (manuel) → `paid`
> 7. Admin assigne une livraison → mission créée

---

### `GET /api/requests` 🔒 Authentifié

Liste des demandes filtrées par rôle.

**Query params :**

| Param | Valeurs | Description |
|-------|---------|-------------|
| `status` | `searching`, `found`, `confirmed`, `completed`, `cancelled`, `all`, `my-responses` (grossiste), `active` (alias searching) | Filtre par statut |
| `urgency` | `low`, `normal`, `high`, `emergency` | Filtre par urgence |
| `page` | nombre | Pagination |
| `limit` | nombre | Limite par page (défaut 20) |

**Comportement par rôle :**

| Rôle | Vue par défaut |
|------|----------------|
| **Pharmacie** | Ses propres demandes uniquement |
| **Grossiste** | Toutes les demandes en `searching` |
| **Admin** | Toutes les demandes |
| **Livraison** | Rien (non autorisé) |

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "REQ-001",
      "productName": "Amoxicilline 500mg",
      "productCode": "AMX-500",
      "dosage": "500mg",
      "quantity": 200,
      "unit": "boîte",
      "status": "searching",
      "urgency": "high",
      "notes": "Besoin urgent pour la saison des pluies",
      "createdAt": "2025-07-25T12:00:00.000Z",
      "pharmacy": {
        "id": "PH-001",
        "name": "Pharmacie Centrale",
        "city": "Douala",
        "region": "Littoral"
      },
      "responses": [
        {
          "id": "RS-001",
          "type": "accepted",
          "price": 3500,
          "wholesaler": {
            "id": "WH-001",
            "name": "DistriPharm Cameroun",
            "logo": null
          }
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/requests/:id` 🔒 Authentifié

Détail d'une demande avec toutes les réponses, la pharmacie, et la commande liée.

---

### `POST /api/requests` 🔒 Pharmacie

Crée une nouvelle demande de produit.

**Body :**
```json
{
  "productName": "Amoxicilline 500mg",
  "productCode": "AMX-500",
  "dosage": "500mg",
  "quantity": 200,
  "unit": "boîte",
  "urgency": "high",
  "notes": "Besoin urgent"
}
```

| Champ | Type | Obligatoire | Défaut |
|-------|------|-------------|--------|
| `productName` | string | ✅ | — |
| `productCode` | string | ❌ | `""` |
| `dosage` | string | ❌ | `null` |
| `quantity` | number | ❌ | `1` |
| `unit` | string | ❌ | `"boîte"` |
| `urgency` | string | ❌ | `"normal"` |
| `notes` | string | ❌ | `null` |

**Comportement :**
- Statut initial : `searching`
- Une notification est créée pour tous les grossistes actifs

---

### `POST /api/requests/:id/accept` 🔒 Grossiste ⚡ FCFS

Le grossiste accepte la demande et fixe son prix.

**Body :**
```json
{
  "price": 3500
}
```

**Règles FCFS :**
1. La transaction est **atomique** — le premier grossiste qui clique gagne
2. Si la demande n'est plus `searching`, retour 409 (`Cette demande a déjà été traitée`)
3. La commande est **créée automatiquement**
4. Le prix de livraison est **calculé automatiquement** selon la ville de la pharmacie
5. La commission est calculée (0% au lancement)

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Demande acceptée — commande créée",
  "data": {
    "request": { ... },
    "response": { ... },
    "order": {
      "id": "ORD-001",
      "productName": "Amoxicilline 500mg",
      "unitPrice": 3500,
      "deliveryPrice": 1500,
      "totalPrice": 701500,
      "status": "created"
    }
  }
}
```

---

### `POST /api/requests/:id/decline` 🔒 Grossiste

Le grossiste décline silencieusement la demande.

**Comportement :**
- Un `RequestResponse` de type `declined` est créé
- La demande **reste en `searching`** pour les autres grossistes
- **Aucune notification** n'est envoyée à la pharmacie

---

### `POST /api/requests/:id/confirm` 🔒 Pharmacie

Confirme la commande après avoir vu le prix.

**Conditions :**
- La demande doit être en statut `found`
- Seule la pharmacie propriétaire peut confirmer

**Effet :** Passe la demande et la commande en statut `confirmed`.

---

### `POST /api/requests/:id/cancel` 🔒 Pharmacie ou Admin

Annule une demande.

**Conditions :**
- La pharmacie propriétaire **ou** l'admin peuvent annuler
- La commande liée est également annulée

---

### `POST /api/requests/:id/mark-paid` 🔒 Admin ou Pharmacie

Marque la commande comme payée (paiement manuel hors plateforme).

**Effet :**
- `paymentStatus` → `paid`
- `paidAt` → date actuelle
- `status` → `confirmed`
- Une entreprise de livraison peut alors être assignée

---

## 📦 Commandes

### `GET /api/orders` 🔒 Authentifié

Liste des commandes filtrées par rôle.

**Query params :** `?status=created|confirmed|processing|shipped|delivered|cancelled&page=1&limit=10`

**Filtrage automatique par rôle :**
| Rôle | Vue |
|------|-----|
| Pharmacie | Ses commandes uniquement |
| Grossiste | Ses commandes uniquement |
| Livraison | Ses missions uniquement |
| Admin | Toutes les commandes |

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-001",
      "productName": "Doliprane 1000mg",
      "quantity": 300,
      "unitPrice": 220,
      "deliveryPrice": 1500,
      "totalPrice": 67500,
      "status": "delivered",
      "paymentStatus": "paid",
      "pharmacyName": "Pharmacie Centrale",
      "wholesalerName": "DistriPharm Cameroun",
      "request": {
        "id": "REQ-003",
        "urgency": "normal",
        "notes": null
      },
      "commission": { ... }
    }
  ]
}
```

---

### `GET /api/orders/:id` 🔒 Authentifié

Détail complet d'une commande avec :
- La demande liée (avec pharmacie et réponses)
- La commission
- Les infos pharmacie, grossiste, entreprise de livraison

---

### `POST /api/orders/:id/assign-delivery` 🔒 Admin

Assigne une entreprise de livraison à une commande payée.

**Body :**
```json
{
  "deliveryCompanyId": "DC-001"
}
```

**Conditions :** Le paiement doit être `paid` avant d'assigner la livraison.

---

### `PATCH /api/orders/:id/status` 🔒 Authentifié

Met à jour le statut d'une commande.

**Body (partiel possible) :**
```json
{
  "status": "shipped",
  "deliveryStatus": "in_transit"
}
```

Si `status = "delivered"`, `deliveryStatus` passe automatiquement à `delivered`.

---

## 🩺 Health Check

### `GET /api/health` 🔓 Publique

```json
{
  "success": true,
  "message": "Bolamu API opérationnelle",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-07-25T12:00:00.000Z"
}
```

---

## 💾 Modèle de données

### Entités principales

```
User (1) ──► (1) Pharmacy
User (1) ──► (1) Wholesaler
User (1) ──► (1) DeliveryCompany

DeliveryCompany (1) ──► (*) DeliveryAgent

Pharmacy (1) ──► (*) ProductRequest
ProductRequest (1) ──► (*) RequestResponse
                    ──► (1) Order

RequestResponse (*) ──► (1) Wholesaler

Order (1) ──► (1) Commission
     (1) ──► (1) DeliveryCompany (optionnel)

Pharmacy (1) ──► (*) Subscription
User (1) ──► (*) Notification
OnboardingRequest (1) ──► (1) User (processedBy)
DeliveryFee (indépendant)
```

### Statuts disponibles

**RequestStatus :** `pending | searching | found | matched | confirmed | in_progress | completed | cancelled | expired`

**OrderStatus :** `created | pending | confirmed | processing | shipped | delivered | cancelled | refunded`

**PaymentStatus :** `unpaid | paid | refunded | partially_paid`

**DeliveryStatus :** `pending | assigned | picked_up | in_transit | delivered | failed`

**OnboardingStatus :** `pending | approved | rejected`

**UserRole :** `admin | pharmacy | wholesaler | delivery_company`

**VehicleType :** `motorcycle | car | van | truck`

### Calcul des prix

```
Total = (Prix médicament × Quantité) + Frais livraison + Commission PSR

- Prix médicament   = Fixé par le grossiste au moment FCFS
- Frais livraison   = Tarif PSR selon la ville (voir DeliveryFee)
- Commission PSR    = 0% au lancement (configurable)
```

### Barème de livraison (11 zones)

| Zone | Standard | Express | Thermosensible |
|------|----------|---------|----------------|
| Douala | 1 500 | 2 500 | 3 000 |
| Yaoundé | 1 500 | 2 500 | 3 000 |
| Brazzaville | 1 000 | 2 000 | 2 500 |
| Pointe-Noire | 1 500 | 2 500 | 3 000 |
| Bafoussam | 1 500 | 2 500 | 3 000 |
| Garoua | 2 000 | 3 000 | 3 500 |
| Dolisie | 2 000 | 3 000 | 3 500 |
| Ouesso | 2 500 | 3 500 | 4 000 |
| Mbalmayo | 1 500 | 2 500 | 3 000 |
| Dschang | 1 500 | 2 500 | 3 000 |
| Mbouda | 1 500 | 2 500 | 3 000 |

---

## ❌ Codes d'erreur

| Code | Signification |
|------|---------------|
| **400** | Requête invalide (champs manquants, validation) |
| **401** | Non authentifié (token manquant ou invalide) |
| **403** | Accès interdit (rôle insuffisant ou compte désactivé) |
| **404** | Ressource non trouvée |
| **409** | Conflit (déjà traité par FCFS, déjà approuvé) |
| **500** | Erreur interne du serveur |

---

## 📐 Schémas de réponse réutilisables

### Pagination
```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Liste paginée (format standard)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

### Création réussie
```json
{
  "success": true,
  "data": { ... },
  "message": "Ressource créée"
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description claire de l'erreur"
}
```

---

## 🏁 Pour lancer

```bash
# 1. Configurer Supabase dans .env
# 2. Installer les dépendances
cd back && npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Appliquer les migrations
npx prisma migrate dev --name init

# 5. Peupler la base
npm run db:seed

# 6. Démarrer le serveur
npm run dev

#   🏥  Bolamu API — PSR PharmaFlow
#   🚀  Serveur démarré sur le port 3000
#   📡  API : http://localhost:3000/api
```

---

> 📘 **Documentation générée le 26 juillet 2026** — Bolamu v1.0.0
