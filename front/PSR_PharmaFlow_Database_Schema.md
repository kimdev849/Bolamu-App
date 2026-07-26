# 🗄️ PSR PharmaFlow — Schéma de Base de Données PostgreSQL + Prisma

> **Version :** 2.0  
> **Date :** 25 Juillet 2026  
> **Moteur :** PostgreSQL 15+  
> **ORM :** Prisma 5.x  
> **Devise :** FCFA (stockée en `Decimal(12,2)`)  
> **Zones :** Multi-villes (Brazzaville, Pointe-Noire, Dolisie, etc.)

---

## 📐 Conventions & Principes

| Règle | Implémentation |
|-------|----------------|
| **Clés primaires** | `UUID v4` (`@default(uuid())`) sur toutes les tables |
| **Timestamps** | `createdAt` + `updatedAt` obligatoires sur chaque table |
| **Soft Delete** | `deletedAt` (DateTime?) sur les tables sensibles (pas de `DELETE` physique) |
| **Devise** | `Decimal(12,2)` pour tous les montants (FCFA) |
| **Statuts** | `ENUM` PostgreSQL pour les workflows figés |
| **JSON** | `Json?` pour les métadonnées flexibles (adresses détaillées, configs) |
| **Indexation** | Index sur les clés étrangères, les statuts, les dates de recherche |
| **Audit** | Table `AuditLog` immuable — toute action sensible est tracée |

---

## 🗺️ Schéma Prisma Complet

```prisma
// ============================================
// GENERATOR & DATASOURCE
// ============================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  SUPER_ADMIN
  PHARMACY_ADMIN
  PHARMACY_USER
  WHOLESALER_ADMIN
  WHOLESALER_USER
  DELIVERY_ADMIN
  DELIVERY_USER
  DRIVER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum RequestStatus {
  SEARCHING      // En recherche chez les grossistes
  FOUND          // Grossiste trouvé (FCFS)
  NOT_FOUND      // Aucun grossiste n'a répondu
  EXPIRED        // Délai de 30 min dépassé
  CANCELLED      // Annulé par la pharmacie
}

enum OrderStatus {
  CREATED        // Commande créée depuis la demande
  CONFIRMED      // Pharmacie a confirmé la commande
  PAID           // Paiement confirmé (manuel ou PawaPay)
  IN_PROGRESS    // Livraison en cours
  DELIVERED      // Livré, en attente OTP final
  COMPLETED      // OTP validé, commande terminée
  DISPUTED       // Litige en cours
  CANCELLED      // Annulée
  REFUNDED       // Remboursée
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  MANUAL
  MOBILE_MONEY
  BANK_TRANSFER
  CASH
  PAWAYAY        // Phase 2
}

enum DeliveryStatus {
  PENDING        // Mission créée, en attente entreprise
  ASSIGNED       // Entreprise a accepté, en attente livreur
  ACCEPTED       // Livreur a accepté
  AT_WHOLESALER  // Livreur arrivé chez le grossiste
  PICKED_UP      // Produit récupéré + OTP pharmacie validé
  IN_TRANSIT     // En route vers la pharmacie
  AT_PHARMACY    // Arrivé à la pharmacie
  DELIVERED      // Livré, en attente OTP client
  COMPLETED      // OTP client validé
  FAILED         // Échec (client absent, produit endommagé, etc.)
  RETURNED       // Retourné au grossiste
}

enum DeliveryType {
  STANDARD
  EXPRESS
  THERMOSENSITIVE
  FRAGILE
  URGENT
}

enum SubscriptionPlan {
  BASIC
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  SUSPENDED
  TRIAL
}

enum NotificationType {
  NEW_REQUEST
  REQUEST_FOUND
  REQUEST_EXPIRED
  NEW_ORDER
  ORDER_CONFIRMED
  PAYMENT_RECEIVED
  DELIVERY_ASSIGNED
  DELIVERY_STATUS_UPDATE
  NEW_MISSION
  MISSION_CANCELLED
  OTP_REMINDER
  SYSTEM
  SUBSCRIPTION_EXPIRING
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  VIEW
  CONFIRM
  CANCEL
  ASSIGN
  VERIFY_OTP
  UPLOAD_PROOF
  PAYMENT
  EXPORT
}

enum TemperatureRange {
  AMBIANT        // 15-25°C
  REFRIGERATED   // 2-8°C
  FROZEN         // -20°C
}

// ============================================
// 1. UTILISATEURS & AUTHENTIFICATION
// ============================================

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  password      String     // bcrypt hash
  firstName     String
  lastName      String
  phone         String?    @unique
  avatarUrl     String?
  role          UserRole   @default(PHARMACY_USER)
  status        UserStatus @default(PENDING_VERIFICATION)
  lastLoginAt   DateTime?
  lastLoginIp   String?
  emailVerified Boolean    @default(false)
  phoneVerified Boolean    @default(false)
  fcmToken      String?    // Firebase Cloud Messaging

  // Relations polymorphes (un user appartient à UNE entité)
  pharmacyId        String?
  pharmacy          Pharmacy?        @relation(fields: [pharmacyId], references: [id])

  wholesalerId      String?
  wholesaler        Wholesaler?      @relation(fields: [wholesalerId], references: [id])

  deliveryCompanyId String?
  deliveryCompany   DeliveryCompany? @relation(fields: [deliveryCompanyId], references: [id])

  deliveryAgentId   String?          @unique
  deliveryAgent     DeliveryAgent?   @relation(fields: [deliveryAgentId], references: [id])

  // Relations
  auditLogs     AuditLog[]
  notifications Notification[]
  sessions      UserSession[]

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  deletedAt     DateTime?

  @@index([email])
  @@index([phone])
  @@index([role])
  @@index([status])
  @@index([pharmacyId])
  @@index([wholesalerId])
  @@index([deliveryCompanyId])
  @@index([deliveryAgentId])
}

model UserSession {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  deviceInfo   String?  // User-Agent
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([refreshToken])
}

// ============================================
// 2. GÉOGRAPHIE — MULTI-VILLES
// ============================================

model Country {
  id        String   @id @default(uuid())
  name      String   @unique // "République du Congo"
  code      String   @unique // "CG"
  phoneCode String   // "+242"
  cities    City[]
  createdAt DateTime @default(now())
}

model City {
  id          String    @id @default(uuid())
  name        String    // "Brazzaville", "Pointe-Noire"
  code        String    @unique // "BZV", "PNR"
  countryId   String
  country     Country   @relation(fields: [countryId], references: [id])

  // Relations
  pharmacies       Pharmacy[]
  wholesalers      Wholesaler[]
  deliveryCompanies DeliveryCompany[]
  zones            Zone[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([countryId])
}

model Zone {
  id          String   @id @default(uuid())
  name        String   // "Centre-ville", "Talangaï", "Mfilou"
  cityId      String
  city        City     @relation(fields: [cityId], references: [id])

  // Géométrie optionnelle (polygone de la zone)
  geoJson     Json?    // GeoJSON Polygon

  // Relations
  pharmacies  Pharmacy[]
  deliveryFees DeliveryFee[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([cityId])
}

// ============================================
// 3. PHARMACIES
// ============================================

model Pharmacy {
  id              String    @id @default(uuid())
  name            String
  registration    String    @unique // Numéro d'enregistment
  licenseNumber   String?   @unique // Autorisation d'exercice
  address         String
  addressDetail   Json?     // { latitude, longitude, building, floor, landmark }

  cityId          String
  city            City      @relation(fields: [cityId], references: [id])
  zoneId          String?
  zone            Zone?     @relation(fields: [zoneId], references: [id])

  phone           String
  phone2          String?
  email           String
  contactName     String
  contactPhone    String?

  isVerified      Boolean   @default(false)
  isActive        Boolean   @default(true)

  // Métriques
  rating          Float?    @default(5.0) // 0-5
  totalOrders     Int       @default(0)
  totalRequests   Int       @default(0)

  // Relations
  users           User[]
  requests        Request[]
  orders          Order[]
  subscription    Subscription?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([cityId])
  @@index([zoneId])
  @@index([isActive])
  @@index([isVerified])
}

// ============================================
// 4. GROSSISTES
// ============================================

model Wholesaler {
  id              String    @id @default(uuid())
  name            String
  registration    String    @unique
  licenseNumber   String?   @unique
  address         String
  addressDetail   Json?

  cityId          String
  city            City      @relation(fields: [cityId], references: [id])

  phone           String
  phone2          String?
  email           String
  contactName     String
  contactPhone    String?

  isVerified      Boolean   @default(false)
  isActive        Boolean   @default(true)

  // Métriques
  responseRate    Float?    @default(0) // % de réponses aux demandes
  avgResponseTime Int?      // secondes moyennes
  totalOrders     Int       @default(0)
  rating          Float?    @default(5.0)

  // Relations
  users           User[]
  requestsFound   Request[] @relation("FoundBy")
  orders          Order[]
  inventory       InventoryItem[] // Stock déclaratif (Phase 2)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([cityId])
  @@index([isActive])
}

// ============================================
// 5. ENTREPRISES DE LIVRAISON
// ============================================

model DeliveryCompany {
  id              String    @id @default(uuid())
  name            String
  registration    String    @unique
  address         String?
  addressDetail   Json?

  cityId          String
  city            City      @relation(fields: [cityId], references: [id])

  phone           String
  phone2          String?
  email           String
  contactName     String

  // Paiement
  paymentPhone    String?   // Mobile Money pour recevoir les paiements PSR
  paymentBank     Json?     // { bankName, accountNumber, accountName }

  isVerified      Boolean   @default(false)
  isActive        Boolean   @default(true)

  // Métriques
  totalMissions   Int       @default(0)
  completionRate  Float?    @default(0)
  avgDeliveryTime Int?      // minutes moyennes
  rating          Float?    @default(5.0)

  // Relations
  users           User[]
  agents          DeliveryAgent[]
  deliveries      Delivery[]
  deliveryFees    DeliveryFee[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([cityId])
  @@index([isActive])
}

// ============================================
// 6. LIVREURS (AGENTS)
// ============================================

model DeliveryAgent {
  id              String    @id @default(uuid())
  firstName       String
  lastName        String
  phone           String    @unique
  email           String?

  // Documents
  idCardNumber    String?
  idCardUrl       String?   // Scan pièce d'identité
  licenseNumber   String?
  licenseUrl      String?   // Scan permis
  photoUrl        String?   // Photo profil

  // Localisation temps réel
  currentLatitude  Float?
  currentLongitude Float?
  locationUpdatedAt DateTime?

  // Statut
  isActive        Boolean   @default(true)
  isOnline        Boolean   @default(false)
  isOnMission     Boolean   @default(false)

  // Device
  fcmToken        String?
  deviceId        String?

  // Relations
  deliveryCompanyId String
  deliveryCompany   DeliveryCompany @relation(fields: [deliveryCompanyId], references: [id])

  user            User?     @relation // Lien 1:1 avec User
  deliveries      Delivery[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([deliveryCompanyId])
  @@index([phone])
  @@index([isOnline])
  @@index([isActive])
}

// ============================================
// 7. PRODUITS & CATALOGUE (ÉVOLUTION)
// ============================================

model ProductCategory {
  id          String    @id @default(uuid())
  name        String    @unique // "Antibiotiques", "Antidouleurs", etc.
  description String?
  icon        String?   // URL icône

  products    Product[]
  createdAt   DateTime  @default(now())
}

model Product {
  id            String    @id @default(uuid())
  name          String
  genericName   String?   // Dénomination commune internationale
  description   String?
  categoryId    String?
  category      ProductCategory? @relation(fields: [categoryId], references: [id])

  // Spécifications médicales
  dosage        String?   // "500mg"
  form          String?   // "Comprimé", "Sirop", "Injectable"
  temperature   TemperatureRange? @default(AMBIANT)
  isPrescription Boolean @default(false) // Nécessite ordonnance

  // Relations
  requests      Request[]
  inventory     InventoryItem[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([categoryId])
  @@index([name])
}

model InventoryItem {
  id            String    @id @default(uuid())
  wholesalerId  String
  wholesaler    Wholesaler @relation(fields: [wholesalerId], references: [id])
  productId     String
  product       Product    @relation(fields: [productId], references: [id])

  quantity      Int       @default(0)
  unitPrice     Decimal   @db.Decimal(12,2) // Prix de vente du grossiste
  isAvailable   Boolean   @default(true)

  updatedAt     DateTime  @updatedAt

  @@unique([wholesalerId, productId])
  @@index([wholesalerId])
  @@index([productId])
}

// ============================================
// 8. DEMANDES (REQUESTS) — CŒUR DU SYSTÈME
// ============================================

model Request {
  id              String        @id @default(uuid())
  reference       String        @unique // REQ-XXXX

  pharmacyId      String
  pharmacy        Pharmacy      @relation(fields: [pharmacyId], references: [id])

  // Produit demandé
  productName     String        // Nom libre (si pas encore dans le catalogue)
  productId       String?       // Lien vers catalogue (optionnel)
  product         Product?      @relation(fields: [productId], references: [id])
  quantity        Int           @default(1)
  dosage          String?       // "500mg" si précisé
  notes           String?       // Commentaire pharmacien

  // Statut & FCFS
  status          RequestStatus @default(SEARCHING)
  foundById       String?       // Grossiste gagnant
  foundBy         Wholesaler?   @relation("FoundBy", fields: [foundById], references: [id])
  foundAt         DateTime?

  // Expiration
  expiresAt       DateTime      // NOW + 30 minutes
  cancelledAt     DateTime?
  cancelReason    String?
  cancelledById   String?       // User ID

  // Urgence
  isUrgent        Boolean       @default(false)

  // Relations
  order           Order?
  responses       RequestResponse[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([pharmacyId])
  @@index([status])
  @@index([foundById])
  @@index([expiresAt])
  @@index([createdAt])
}

model RequestResponse {
  id            String       @id @default(uuid())
  requestId     String
  request       Request      @relation(fields: [requestId], references: [id], onDelete: Cascade)

  wholesalerId  String
  responseType  ResponseType // VIEWED, CONFIRMED, DECLINED

  respondedAt   DateTime     @default(now())

  @@index([requestId])
  @@index([wholesalerId])
}

// ============================================
// 9. COMMANDES (ORDERS)
// ============================================

model Order {
  id                String      @id @default(uuid())
  reference         String      @unique // ORD-XXXX

  // Liens
  requestId         String      @unique
  request           Request     @relation(fields: [requestId], references: [id])

  pharmacyId        String
  pharmacy          Pharmacy    @relation(fields: [pharmacyId], references: [id])

  wholesalerId      String
  wholesaler        Wholesaler  @relation(fields: [wholesalerId], references: [id])

  // Montants (FCFA)
  productAmount     Decimal     @db.Decimal(12,2) // Prix du médicament
  deliveryAmount    Decimal     @db.Decimal(12,2) // Frais de livraison
  commissionAmount  Decimal     @default(0.00) @db.Decimal(12,2) // Commission PSR
  totalAmount       Decimal     @db.Decimal(12,2) // Somme totale

  // Statuts
  orderStatus       OrderStatus @default(CREATED)
  paymentStatus     PaymentStatus @default(PENDING)
  deliveryStatus    DeliveryStatus @default(PENDING)

  // OTP Client (validation livraison finale)
  otpCode           String?     @db.VarChar(4)
  otpExpiresAt      DateTime?
  otpVerifiedAt     DateTime?
  otpAttempts       Int         @default(0)

  // Relations
  delivery          Delivery?
  payment           Payment?

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([pharmacyId])
  @@index([wholesalerId])
  @@index([orderStatus])
  @@index([paymentStatus])
  @@index([createdAt])
}

// ============================================
// 10. LIVRAISONS (DELIVERIES)
// ============================================

model Delivery {
  id                  String         @id @default(uuid())

  orderId             String         @unique
  order               Order          @relation(fields: [orderId], references: [id])

  deliveryCompanyId   String
  deliveryCompany     DeliveryCompany @relation(fields: [deliveryCompanyId], references: [id])

  deliveryAgentId     String?
  deliveryAgent       DeliveryAgent?  @relation(fields: [deliveryAgentId], references: [id])

  // Type de livraison
  deliveryType        DeliveryType   @default(STANDARD)

  // Statut
  status              DeliveryStatus @default(PENDING)

  // OTP Pharmacie (validation retrait chez le grossiste)
  pickupOtpCode       String?        @db.VarChar(4)
  pickupOtpExpiresAt  DateTime?
  pickupOtpVerifiedAt DateTime?
  pickupOtpAttempts   Int            @default(0)

  // Timestamps du workflow
  assignedAt          DateTime?      // Entreprise assignée
  acceptedAt          DateTime?      // Livreur a accepté
  atWholesalerAt      DateTime?      // Arrivé chez grossiste
  pickedUpAt          DateTime?      // Produit récupéré
  inTransitAt         DateTime?      // En route
  atPharmacyAt        DateTime?      // Arrivé à pharmacie
  deliveredAt         DateTime?      // Livré
  completedAt         DateTime?      // OTP validé
  failedAt            DateTime?

  // Preuves
  proofPhotoUrl       String?        // Photo produit remis
  pickupPhotoUrl      String?        // Photo produit récupéré (optionnel)
  signatureUrl        String?        // Signature numérique (Phase 2)
  deliveryNotes       String?        // Notes du livreur
  failureReason       String?        // Si échec

  // Géolocalisation
  pickupLatitude      Float?
  pickupLongitude     Float?
  dropoffLatitude     Float?
  dropoffLongitude    Float?

  // Relations
  statusHistory       DeliveryStatusHistory[]

  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  @@index([deliveryCompanyId])
  @@index([deliveryAgentId])
  @@index([status])
  @@index([createdAt])
}

model DeliveryStatusHistory {
  id          String         @id @default(uuid())
  deliveryId  String
  delivery    Delivery       @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  status      DeliveryStatus
  changedById String?        // User ID ou Agent ID
  notes       String?

  createdAt   DateTime       @default(now())

  @@index([deliveryId])
  @@index([createdAt])
}

// ============================================
// 11. PAIEMENTS
// ============================================

model Payment {
  id            String        @id @default(uuid())

  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id])

  amount        Decimal       @db.Decimal(12,2)
  method        PaymentMethod @default(MANUAL)
  status        PaymentStatus @default(PENDING)

  // Détails
  transactionRef String?      // Référence externe (PawaPay, etc.)
  paidById      String?       // User ID (qui a confirmé le paiement)
  paidAt        DateTime?
  notes         String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([orderId])
  @@index([status])
  @@index([createdAt])
}

// ============================================
// 12. FRAIS DE LIVRAISON (PAR ZONE & ENTREPRISE)
// ============================================

model DeliveryFee {
  id                String          @id @default(uuid())

  zoneId            String
  zone              Zone            @relation(fields: [zoneId], references: [id])

  deliveryCompanyId String?
  deliveryCompany   DeliveryCompany? @relation(fields: [deliveryCompanyId], references: [id])

  // Si null = tarif PSR par défaut
  baseAmount        Decimal         @db.Decimal(12,2) // Tarif de base
  expressAmount     Decimal?        @db.Decimal(12,2) // Tarif express
  thermoAmount      Decimal?        @db.Decimal(12,2) // Tarif thermosensible

  isActive          Boolean         @default(true)

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([zoneId, deliveryCompanyId])
  @@index([zoneId])
}

// ============================================
// 13. COMMISSIONS CONFIGURABLES
// ============================================

model CommissionRule {
  id              String   @id @default(uuid())
  name            String   // "Standard 2026", "Promotion Lancement"
  description     String?

  // Pourcentages
  productPercent  Decimal  @db.Decimal(5,2) // ex: 2.00 = 2%
  deliveryPercent Decimal  @db.Decimal(5,2) // ex: 5.00 = 5% sur livraison
  fixedFee        Decimal? @db.Decimal(12,2) // Frais fixe optionnel

  // Conditions
  minAmount       Decimal? @db.Decimal(12,2) // Montant minimum pour appliquer
  maxAmount       Decimal? @db.Decimal(12,2) // Montant maximum

  isActive        Boolean  @default(true)
  effectiveFrom   DateTime // Date de début
  effectiveTo     DateTime? // Date de fin (null = illimité)

  createdById     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive])
  @@index([effectiveFrom])
}

// ============================================
// 14. ABONNEMENTS PHARMACIE
// ============================================

model Subscription {
  id          String             @id @default(uuid())

  pharmacyId  String             @unique
  pharmacy    Pharmacy           @relation(fields: [pharmacyId], references: [id])

  plan        SubscriptionPlan   @default(BASIC)
  price       Decimal            @db.Decimal(12,2) // Prix mensuel FCFA

  startDate   DateTime
  endDate     DateTime
  status      SubscriptionStatus @default(TRIAL)

  // Paiement
  lastPaymentAt DateTime?
  nextPaymentAt DateTime?

  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([pharmacyId])
  @@index([status])
}

// ============================================
// 15. NOTIFICATIONS
// ============================================

model Notification {
  id          String           @id @default(uuid())

  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  type        NotificationType
  title       String
  message     String

  // Payload JSON pour navigation deep-link
  payload     Json?            // { orderId: "...", deliveryId: "...", screen: "..." }

  isRead      Boolean          @default(false)
  readAt      DateTime?

  // Push
  pushSent    Boolean          @default(false)
  pushSentAt  DateTime?

  createdAt   DateTime         @default(now())

  @@index([userId])
  @@index([isRead])
  @@index([type])
  @@index([createdAt])
}

// ============================================
// 16. JOURNAL D'AUDIT (IMMUTABLE)
// ============================================

model AuditLog {
  id          String     @id @default(uuid())

  userId      String?
  user        User?      @relation(fields: [userId], references: [id])

  action      AuditAction
  entityType  String     // "Order", "Request", "Delivery", "User"
  entityId    String?    // UUID de l'entité concernée

  details     Json?      // { before: {}, after: {} }

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime   @default(now())

  @@index([userId])
  @@index([entityType])
  @@index([entityId])
  @@index([action])
  @@index([createdAt])
}

// ============================================
// 17. PARAMÈTRES SYSTÈME
// ============================================

model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique // "request_expiry_minutes", "otp_expiry_seconds"
  value       String   // Stocké en string, cast côté app
  type        String   // "number", "string", "boolean", "json"
  description String?
  isEditable  Boolean  @default(true)

  updatedById String?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}
```

---

## 📊 Diagramme Relationnel (Résumé)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Country   │────▶│    City     │────▶│    Zone     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
        ┌──────────────┬──────────────┬───────┴───────┐
        │              │              │               │
        ▼              ▼              ▼               ▼
   ┌─────────┐   ┌──────────┐  ┌──────────────┐  ┌─────────────┐
   │Pharmacy │   │Wholesaler│  │DeliveryCompany│  │DeliveryFee  │
   └────┬────┘   └────┬─────┘  └──────┬───────┘  └─────────────┘
        │             │               │
        │    ┌────────┘               │
        │    │                        │
        ▼    ▼                        ▼
   ┌─────────────────────────────────────────┐
   │                 Request                 │
   │  (FCFS — FOUND par un seul grossiste)   │
   └──────────────────┬──────────────────────┘
                      │ 1:1
                      ▼
   ┌─────────────────────────────────────────┐
   │                  Order                  │
   │  (Montants : product + delivery + com)  │
   └──────────────────┬──────────────────────┘
                      │ 1:1
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │Delivery │  │ Payment  │  │  Audit   │
   │(Status  │  │(MANUAL,  │  │  Logs    │
   │ History)│  │ MM, Bank)│  │          │
   └─────────┘  └──────────┘  └──────────┘
```

---

## 🔧 Indexes Clés pour la Performance

| Table | Index | Usage |
|-------|-------|-------|
| `Request` | `(status, expiresAt)` | Requêtes FCFS des grossistes |
| `Request` | `(pharmacyId, createdAt DESC)` | Liste demandes pharmacie |
| `Order` | `(pharmacyId, orderStatus)` | Dashboard pharmacie |
| `Order` | `(wholesalerId, orderStatus)` | Dashboard grossiste |
| `Delivery` | `(deliveryAgentId, status)` | Missions en cours livreur |
| `Delivery` | `(deliveryCompanyId, status)` | Dashboard entreprise |
| `DeliveryAgent` | `(deliveryCompanyId, isOnline, isActive)` | Livreurs disponibles |
| `AuditLog` | `(entityType, entityId, createdAt DESC)` | Historique d'une entité |

---

## 🌱 Seed Data (Données Initiales)

```sql
-- Pays & Villes
INSERT INTO "Country" (id, name, code, "phoneCode") VALUES
('c1', 'République du Congo', 'CG', '+242');

INSERT INTO "City" (id, name, code, "countryId") VALUES
('city-1', 'Brazzaville', 'BZV', 'c1'),
('city-2', 'Pointe-Noire', 'PNR', 'c1'),
('city-3', 'Dolisie', 'DOL', 'c1'),
('city-4', 'Nkayi', 'NKY', 'c1');

-- Zones Brazzaville
INSERT INTO "Zone" (id, name, "cityId") VALUES
('z1', 'Centre-ville', 'city-1'),
('z2', 'Talangaï', 'city-1'),
('z3', 'Mfilou', 'city-1'),
('z4', 'Ouenzé', 'city-1'),
('z5', 'Poto-Poto', 'city-1'),
('z6', 'Makélékélé', 'city-1');

-- Paramètres système
INSERT INTO "SystemSetting" (id, key, value, type, description) VALUES
('s1', 'request_expiry_minutes', '30', 'number', 'Durée avant expiration d'une demande'),
('s2', 'otp_expiry_seconds', '600', 'number', 'Durée de validité d'un OTP (10 min)'),
('s3', 'otp_max_attempts', '3', 'number', 'Nombre max de tentatives OTP'),
('s4', 'max_delivery_photo_size_mb', '5', 'number', 'Taille max photo preuve (Mo)'),
('s5', 'commission_enabled', 'false', 'boolean', 'Activer les commissions (Phase 2)'),
('s6', 'default_delivery_amount', '1500', 'number', 'Frais livraison par défaut FCFA');

-- Règle commission (0% au lancement)
INSERT INTO "CommissionRule" (id, name, description, "productPercent", "deliveryPercent", "fixedFee", "isActive", "effectiveFrom") VALUES
('cr1', 'Lancement Zero', 'Commission à 0% pour le lancement', 0.00, 0.00, 0.00, true, NOW());

-- Catégories produits
INSERT INTO "ProductCategory" (id, name, description) VALUES
('pc1', 'Antibiotiques', 'Médicaments antibactériens'),
('pc2', 'Antidouleurs', 'Analgésiques et antipyrétiques'),
('pc3', 'Cardiovasculaire', 'Médicaments pour le cœur et la tension'),
('pc4', 'Diabète', 'Insulines et antidiabétiques'),
('pc5', 'Vitamines', 'Compléments alimentaires'),
('pc6', 'Pédiatrie', 'Médicaments pour enfants'),
('pc7', 'Thermosensible', 'Produits nécessitant le froid');
```

---

## 📈 Évolutions Futures (Migrations Prisma)

| Phase | Feature | Tables concernées |
|-------|---------|-------------------|
| **Phase 2** | PawaPay Integration | `Payment` (ajout `transactionRef`, `providerResponse`) |
| **Phase 2** | Chat intégré | Nouvelle table `Conversation`, `Message` |
| **Phase 2** | Signature numérique | `Delivery.signatureUrl` (déjà présent) |
| **Phase 2** | QR Code scan | `Delivery.qrCodeData` |
| **Phase 3** | Analytics avancés | Nouvelle table `MetricDaily` (agrégats) |
| **Phase 3** | Multi-pays | `Country` (déjà prêt) — ajout pays voisins |
| **Phase 3** | Programme fidélité | Nouvelle table `LoyaltyPoint` |
| **Phase 3** | Stock grossiste temps réel | `InventoryItem` (déjà prêt) + WebSocket |

---

## 🚀 Commandes Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name init_psr_schema

# Appliquer en production
npx prisma migrate deploy

# Seed les données
npx prisma db seed

# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Formater le schema
npx prisma format
```

---

## ✅ Checklist Validation Schéma

- [ ] Toutes les tables ont `createdAt` + `updatedAt`
- [ ] Toutes les clés étrangères ont un index
- [ ] Les montants sont en `Decimal(12,2)` (pas de Float pour la monnaie)
- [ ] Les ENUMs couvrent tous les statuts du workflow
- [ ] Le soft delete est implémenté (`deletedAt`)
- [ ] L'audit est traçable (`AuditLog`)
- [ ] La multi-ville est supportée (`City`, `Zone`)
- [ ] Les commissions sont configurables (`CommissionRule`)
- [ ] Les OTPs sont traçables (tentatives, expiration)
- [ ] Les photos de preuve sont stockées (URLs)

---

*Schéma prêt pour le déploiement. Prochaine étape : `npx prisma migrate dev`*
