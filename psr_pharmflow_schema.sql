-- ============================================================
-- PSR PharmaFlow — Schéma PostgreSQL Complet
-- Version : 2.0
-- Date : 25 Juillet 2026
-- Moteur : PostgreSQL 15+
-- Devise : FCFA (Decimal 12,2)
-- Zones : Multi-villes (Brazzaville, Pointe-Noire, etc.)
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour recherche texte future

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE "UserRole" AS ENUM (
  'SUPER_ADMIN',
  'PHARMACY_ADMIN',
  'PHARMACY_USER',
  'WHOLESALER_ADMIN',
  'WHOLESALER_USER',
  'DELIVERY_ADMIN',
  'DELIVERY_USER',
  'DRIVER'
);

CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);

CREATE TYPE "RequestStatus" AS ENUM (
  'SEARCHING',
  'FOUND',
  'NOT_FOUND',
  'EXPIRED',
  'CANCELLED'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'CREATED',
  'CONFIRMED',
  'PAID',
  'IN_PROGRESS',
  'DELIVERED',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'MANUAL',
  'MOBILE_MONEY',
  'BANK_TRANSFER',
  'CASH',
  'PAWAYAY'
);

CREATE TYPE "DeliveryStatus" AS ENUM (
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'AT_WHOLESALER',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_PHARMACY',
  'DELIVERED',
  'COMPLETED',
  'FAILED',
  'RETURNED'
);

CREATE TYPE "DeliveryType" AS ENUM (
  'STANDARD',
  'EXPRESS',
  'THERMOSENSITIVE',
  'FRAGILE',
  'URGENT'
);

CREATE TYPE "SubscriptionPlan" AS ENUM (
  'BASIC',
  'PRO',
  'ENTERPRISE'
);

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'ACTIVE',
  'EXPIRED',
  'CANCELLED',
  'SUSPENDED',
  'TRIAL'
);

CREATE TYPE "NotificationType" AS ENUM (
  'NEW_REQUEST',
  'REQUEST_FOUND',
  'REQUEST_EXPIRED',
  'NEW_ORDER',
  'ORDER_CONFIRMED',
  'PAYMENT_RECEIVED',
  'DELIVERY_ASSIGNED',
  'DELIVERY_STATUS_UPDATE',
  'NEW_MISSION',
  'MISSION_CANCELLED',
  'OTP_REMINDER',
  'SYSTEM',
  'SUBSCRIPTION_EXPIRING'
);

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'VIEW',
  'CONFIRM',
  'CANCEL',
  'ASSIGN',
  'VERIFY_OTP',
  'UPLOAD_PROOF',
  'PAYMENT',
  'EXPORT'
);

CREATE TYPE "TemperatureRange" AS ENUM (
  'AMBIANT',
  'REFRIGERATED',
  'FROZEN'
);

CREATE TYPE "SynonymType" AS ENUM (
  'COMMERCIAL',
  'ABBREVIATION',
  'LOCAL',
  'ALTERNATIVE_DCI'
);

CREATE TYPE "ResponseType" AS ENUM (
  'VIEWED',
  'CONFIRMED',
  'DECLINED'
);

-- ============================================================
-- 2. TABLES
-- ============================================================

-- -----------------------------------------------------------
-- 2.1 GÉOGRAPHIE
-- -----------------------------------------------------------

CREATE TABLE "Country" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "code" VARCHAR(10) NOT NULL UNIQUE,
  "phoneCode" VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "City" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(10) NOT NULL UNIQUE,
  "countryId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_city_country" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT
);

CREATE TABLE "Zone" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "cityId" UUID NOT NULL,
  "geoJson" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_zone_city" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.2 UTILISATEURS & AUTHENTIFICATION
-- -----------------------------------------------------------

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) UNIQUE,
  "avatarUrl" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'PHARMACY_USER',
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "lastLoginIp" VARCHAR(255),
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "fcmToken" TEXT,
  "pharmacyId" UUID,
  "wholesalerId" UUID,
  "deliveryCompanyId" UUID,
  "deliveryAgentId" UUID UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "fk_user_pharmacy" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_user_wholesaler" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_user_delivery_company" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_user_delivery_agent" FOREIGN KEY ("deliveryAgentId") REFERENCES "DeliveryAgent"("id") ON DELETE SET NULL
);

CREATE TABLE "UserSession" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "refreshToken" VARCHAR(255) NOT NULL UNIQUE,
  "deviceInfo" TEXT,
  "ipAddress" VARCHAR(255),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_session_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- 2.3 PHARMACIES
-- -----------------------------------------------------------

CREATE TABLE "Pharmacy" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "registration" VARCHAR(255) NOT NULL UNIQUE,
  "licenseNumber" VARCHAR(255) UNIQUE,
  "address" TEXT NOT NULL,
  "addressDetail" JSONB,
  "cityId" UUID NOT NULL,
  "zoneId" UUID,
  "phone" VARCHAR(50) NOT NULL,
  "phone2" VARCHAR(50),
  "email" VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255) NOT NULL,
  "contactPhone" VARCHAR(50),
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "rating" DECIMAL(3,2) DEFAULT 5.0,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "totalRequests" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "fk_pharmacy_city" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_pharmacy_zone" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- 2.4 GROSSISTES
-- -----------------------------------------------------------

CREATE TABLE "Wholesaler" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "registration" VARCHAR(255) NOT NULL UNIQUE,
  "licenseNumber" VARCHAR(255) UNIQUE,
  "address" TEXT NOT NULL,
  "addressDetail" JSONB,
  "cityId" UUID NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "phone2" VARCHAR(50),
  "email" VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255) NOT NULL,
  "contactPhone" VARCHAR(50),
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "responseRate" DECIMAL(5,2) DEFAULT 0,
  "avgResponseTime" INTEGER,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "rating" DECIMAL(3,2) DEFAULT 5.0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "fk_wholesaler_city" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.5 ENTREPRISES DE LIVRAISON
-- -----------------------------------------------------------

CREATE TABLE "DeliveryCompany" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "registration" VARCHAR(255) NOT NULL UNIQUE,
  "address" TEXT,
  "addressDetail" JSONB,
  "cityId" UUID NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "phone2" VARCHAR(50),
  "email" VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255) NOT NULL,
  "paymentPhone" VARCHAR(50),
  "paymentBank" JSONB,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "totalMissions" INTEGER NOT NULL DEFAULT 0,
  "completionRate" DECIMAL(5,2) DEFAULT 0,
  "avgDeliveryTime" INTEGER,
  "rating" DECIMAL(3,2) DEFAULT 5.0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "fk_delivery_company_city" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.6 LIVREURS (AGENTS)
-- -----------------------------------------------------------

CREATE TABLE "DeliveryAgent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) NOT NULL UNIQUE,
  "email" VARCHAR(255),
  "idCardNumber" VARCHAR(255),
  "idCardUrl" TEXT,
  "licenseNumber" VARCHAR(255),
  "licenseUrl" TEXT,
  "photoUrl" TEXT,
  "currentLatitude" DECIMAL(10, 8),
  "currentLongitude" DECIMAL(11, 8),
  "locationUpdatedAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isOnline" BOOLEAN NOT NULL DEFAULT FALSE,
  "isOnMission" BOOLEAN NOT NULL DEFAULT FALSE,
  "fcmToken" TEXT,
  "deviceId" VARCHAR(255),
  "deliveryCompanyId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "fk_agent_company" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.7 PRODUITS & CATALOGUE
-- -----------------------------------------------------------

CREATE TABLE "ProductCategory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT,
  "icon" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "genericName" VARCHAR(255),
  "description" TEXT,
  "categoryId" UUID,
  "dosage" VARCHAR(100),
  "form" VARCHAR(100),
  "temperature" "TemperatureRange" DEFAULT 'AMBIANT',
  "isPrescription" BOOLEAN NOT NULL DEFAULT FALSE,
  "cipCode" VARCHAR(100) UNIQUE,
  "localCode" VARCHAR(100) UNIQUE,
  "packaging" VARCHAR(255),
  "manufacturer" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_product_category" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL
);

CREATE TABLE "ProductSynonym" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "type" "SynonymType" NOT NULL DEFAULT 'COMMERCIAL',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_synonym_product" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

CREATE TABLE "InventoryItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "wholesalerId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "unitPrice" DECIMAL(12, 2) NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_inventory_wholesaler" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_inventory_product" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_inventory" UNIQUE ("wholesalerId", "productId")
);

-- -----------------------------------------------------------
-- 2.8 DEMANDES (REQUESTS) — CŒUR DU SYSTÈME
-- -----------------------------------------------------------

CREATE TABLE "Request" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "reference" VARCHAR(50) NOT NULL UNIQUE,
  "pharmacyId" UUID NOT NULL,
  "productName" VARCHAR(255) NOT NULL,
  "productId" UUID,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "dosage" VARCHAR(100),
  "notes" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'SEARCHING',
  "foundById" UUID,
  "foundAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "cancelledAt" TIMESTAMP WITH TIME ZONE,
  "cancelReason" TEXT,
  "cancelledById" UUID,
  "isUrgent" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_request_pharmacy" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_request_product" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_request_found_by" FOREIGN KEY ("foundById") REFERENCES "Wholesaler"("id") ON DELETE SET NULL
);

CREATE TABLE "RequestResponse" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "requestId" UUID NOT NULL,
  "wholesalerId" UUID NOT NULL,
  "responseType" "ResponseType" NOT NULL DEFAULT 'VIEWED',
  "respondedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_response_request" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_response_wholesaler" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.9 COMMANDES (ORDERS)
-- -----------------------------------------------------------

CREATE TABLE "Order" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "reference" VARCHAR(50) NOT NULL UNIQUE,
  "requestId" UUID NOT NULL UNIQUE,
  "pharmacyId" UUID NOT NULL,
  "wholesalerId" UUID NOT NULL,
  "productAmount" DECIMAL(12, 2) NOT NULL,
  "deliveryAmount" DECIMAL(12, 2) NOT NULL,
  "commissionAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "orderStatus" "OrderStatus" NOT NULL DEFAULT 'CREATED',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "otpCode" VARCHAR(4),
  "otpExpiresAt" TIMESTAMP WITH TIME ZONE,
  "otpVerifiedAt" TIMESTAMP WITH TIME ZONE,
  "otpAttempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_order_request" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_order_pharmacy" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_order_wholesaler" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.10 LIVRAISONS (DELIVERIES)
-- -----------------------------------------------------------

CREATE TABLE "Delivery" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL UNIQUE,
  "deliveryCompanyId" UUID NOT NULL,
  "deliveryAgentId" UUID,
  "deliveryType" "DeliveryType" NOT NULL DEFAULT 'STANDARD',
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "pickupOtpCode" VARCHAR(4),
  "pickupOtpExpiresAt" TIMESTAMP WITH TIME ZONE,
  "pickupOtpVerifiedAt" TIMESTAMP WITH TIME ZONE,
  "pickupOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  "assignedAt" TIMESTAMP WITH TIME ZONE,
  "acceptedAt" TIMESTAMP WITH TIME ZONE,
  "atWholesalerAt" TIMESTAMP WITH TIME ZONE,
  "pickedUpAt" TIMESTAMP WITH TIME ZONE,
  "inTransitAt" TIMESTAMP WITH TIME ZONE,
  "atPharmacyAt" TIMESTAMP WITH TIME ZONE,
  "deliveredAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "failedAt" TIMESTAMP WITH TIME ZONE,
  "proofPhotoUrl" TEXT,
  "pickupPhotoUrl" TEXT,
  "signatureUrl" TEXT,
  "deliveryNotes" TEXT,
  "failureReason" TEXT,
  "pickupLatitude" DECIMAL(10, 8),
  "pickupLongitude" DECIMAL(11, 8),
  "dropoffLatitude" DECIMAL(10, 8),
  "dropoffLongitude" DECIMAL(11, 8),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_delivery_order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_delivery_company" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_delivery_agent" FOREIGN KEY ("deliveryAgentId") REFERENCES "DeliveryAgent"("id") ON DELETE SET NULL
);

CREATE TABLE "DeliveryStatusHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "deliveryId" UUID NOT NULL,
  "status" "DeliveryStatus" NOT NULL,
  "changedById" UUID,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_history_delivery" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- 2.11 PAIEMENTS
-- -----------------------------------------------------------

CREATE TABLE "Payment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL UNIQUE,
  "amount" DECIMAL(12, 2) NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'MANUAL',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "transactionRef" VARCHAR(255),
  "paidById" UUID,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_payment_order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.12 FRAIS DE LIVRAISON
-- -----------------------------------------------------------

CREATE TABLE "DeliveryFee" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "zoneId" UUID NOT NULL,
  "deliveryCompanyId" UUID,
  "baseAmount" DECIMAL(12, 2) NOT NULL,
  "expressAmount" DECIMAL(12, 2),
  "thermoAmount" DECIMAL(12, 2),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_fee_zone" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_fee_company" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_fee" UNIQUE ("zoneId", "deliveryCompanyId")
);

-- -----------------------------------------------------------
-- 2.13 COMMISSIONS CONFIGURABLES
-- -----------------------------------------------------------

CREATE TABLE "CommissionRule" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "productPercent" DECIMAL(5, 2) NOT NULL,
  "deliveryPercent" DECIMAL(5, 2) NOT NULL,
  "fixedFee" DECIMAL(12, 2),
  "minAmount" DECIMAL(12, 2),
  "maxAmount" DECIMAL(12, 2),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "effectiveFrom" TIMESTAMP WITH TIME ZONE NOT NULL,
  "effectiveTo" TIMESTAMP WITH TIME ZONE,
  "createdById" UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 2.14 ABONNEMENTS PHARMACIE
-- -----------------------------------------------------------

CREATE TABLE "Subscription" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "pharmacyId" UUID NOT NULL UNIQUE,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
  "price" DECIMAL(12, 2) NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "lastPaymentAt" TIMESTAMP WITH TIME ZONE,
  "nextPaymentAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_subscription_pharmacy" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT
);

-- -----------------------------------------------------------
-- 2.15 NOTIFICATIONS
-- -----------------------------------------------------------

CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "pushSent" BOOLEAN NOT NULL DEFAULT FALSE,
  "pushSentAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_notification_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- 2.16 JOURNAL D'AUDIT (IMMUTABLE)
-- -----------------------------------------------------------

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "action" "AuditAction" NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" UUID,
  "details" JSONB,
  "ipAddress" VARCHAR(255),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_audit_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- 2.17 PARAMÈTRES SYSTÈME
-- -----------------------------------------------------------

CREATE TABLE "SystemSetting" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "key" VARCHAR(255) NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "isEditable" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedById" UUID,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- User indexes
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_phone" ON "User"("phone");
CREATE INDEX "idx_user_role" ON "User"("role");
CREATE INDEX "idx_user_status" ON "User"("status");
CREATE INDEX "idx_user_pharmacy" ON "User"("pharmacyId");
CREATE INDEX "idx_user_wholesaler" ON "User"("wholesalerId");
CREATE INDEX "idx_user_delivery_company" ON "User"("deliveryCompanyId");
CREATE INDEX "idx_user_delivery_agent" ON "User"("deliveryAgentId");

-- Session indexes
CREATE INDEX "idx_session_user" ON "UserSession"("userId");
CREATE INDEX "idx_session_refresh" ON "UserSession"("refreshToken");

-- City / Zone indexes
CREATE INDEX "idx_city_country" ON "City"("countryId");
CREATE INDEX "idx_zone_city" ON "Zone"("cityId");

-- Pharmacy indexes
CREATE INDEX "idx_pharmacy_city" ON "Pharmacy"("cityId");
CREATE INDEX "idx_pharmacy_zone" ON "Pharmacy"("zoneId");
CREATE INDEX "idx_pharmacy_active" ON "Pharmacy"("isActive");
CREATE INDEX "idx_pharmacy_verified" ON "Pharmacy"("isVerified");

-- Wholesaler indexes
CREATE INDEX "idx_wholesaler_city" ON "Wholesaler"("cityId");
CREATE INDEX "idx_wholesaler_active" ON "Wholesaler"("isActive");

-- DeliveryCompany indexes
CREATE INDEX "idx_company_city" ON "DeliveryCompany"("cityId");
CREATE INDEX "idx_company_active" ON "DeliveryCompany"("isActive");

-- DeliveryAgent indexes
CREATE INDEX "idx_agent_company" ON "DeliveryAgent"("deliveryCompanyId");
CREATE INDEX "idx_agent_phone" ON "DeliveryAgent"("phone");
CREATE INDEX "idx_agent_online" ON "DeliveryAgent"("isOnline");
CREATE INDEX "idx_agent_active" ON "DeliveryAgent"("isActive");

-- Product indexes
CREATE INDEX "idx_product_category" ON "Product"("categoryId");
CREATE INDEX "idx_product_name" ON "Product"("name");
CREATE INDEX "idx_product_active" ON "Product"("isActive");
CREATE INDEX "idx_product_name_trgm" ON "Product" USING gin ("name" gin_trgm_ops);

-- ProductSynonym indexes
CREATE INDEX "idx_synonym_product" ON "ProductSynonym"("productId");
CREATE INDEX "idx_synonym_name" ON "ProductSynonym"("name");
CREATE INDEX "idx_synonym_name_trgm" ON "ProductSynonym" USING gin ("name" gin_trgm_ops);

-- Inventory indexes
CREATE INDEX "idx_inventory_wholesaler" ON "InventoryItem"("wholesalerId");
CREATE INDEX "idx_inventory_product" ON "InventoryItem"("productId");

-- Request indexes (CRITIQUES pour FCFS)
CREATE INDEX "idx_request_pharmacy" ON "Request"("pharmacyId");
CREATE INDEX "idx_request_status" ON "Request"("status");
CREATE INDEX "idx_request_found_by" ON "Request"("foundById");
CREATE INDEX "idx_request_expires" ON "Request"("expiresAt");
CREATE INDEX "idx_request_created" ON "Request"("createdAt");
CREATE INDEX "idx_request_status_expires" ON "Request"("status", "expiresAt");
CREATE INDEX "idx_request_pharmacy_created" ON "Request"("pharmacyId", "createdAt" DESC);

-- RequestResponse indexes
CREATE INDEX "idx_response_request" ON "RequestResponse"("requestId");
CREATE INDEX "idx_response_wholesaler" ON "RequestResponse"("wholesalerId");

-- Order indexes
CREATE INDEX "idx_order_pharmacy" ON "Order"("pharmacyId");
CREATE INDEX "idx_order_wholesaler" ON "Order"("wholesalerId");
CREATE INDEX "idx_order_status" ON "Order"("orderStatus");
CREATE INDEX "idx_order_payment" ON "Order"("paymentStatus");
CREATE INDEX "idx_order_created" ON "Order"("createdAt");

-- Delivery indexes
CREATE INDEX "idx_delivery_company" ON "Delivery"("deliveryCompanyId");
CREATE INDEX "idx_delivery_agent" ON "Delivery"("deliveryAgentId");
CREATE INDEX "idx_delivery_status" ON "Delivery"("status");
CREATE INDEX "idx_delivery_created" ON "Delivery"("createdAt");

-- DeliveryStatusHistory indexes
CREATE INDEX "idx_history_delivery" ON "DeliveryStatusHistory"("deliveryId");
CREATE INDEX "idx_history_created" ON "DeliveryStatusHistory"("createdAt");

-- Payment indexes
CREATE INDEX "idx_payment_order" ON "Payment"("orderId");
CREATE INDEX "idx_payment_status" ON "Payment"("status");
CREATE INDEX "idx_payment_created" ON "Payment"("createdAt");

-- DeliveryFee indexes
CREATE INDEX "idx_fee_zone" ON "DeliveryFee"("zoneId");

-- CommissionRule indexes
CREATE INDEX "idx_commission_active" ON "CommissionRule"("isActive");
CREATE INDEX "idx_commission_from" ON "CommissionRule"("effectiveFrom");

-- Subscription indexes
CREATE INDEX "idx_subscription_pharmacy" ON "Subscription"("pharmacyId");
CREATE INDEX "idx_subscription_status" ON "Subscription"("status");

-- Notification indexes
CREATE INDEX "idx_notif_user" ON "Notification"("userId");
CREATE INDEX "idx_notif_read" ON "Notification"("isRead");
CREATE INDEX "idx_notif_type" ON "Notification"("type");
CREATE INDEX "idx_notif_created" ON "Notification"("createdAt");

-- AuditLog indexes
CREATE INDEX "idx_audit_user" ON "AuditLog"("userId");
CREATE INDEX "idx_audit_entity_type" ON "AuditLog"("entityType");
CREATE INDEX "idx_audit_entity_id" ON "AuditLog"("entityId");
CREATE INDEX "idx_audit_action" ON "AuditLog"("action");
CREATE INDEX "idx_audit_created" ON "AuditLog"("createdAt");

-- ============================================================
-- 4. SEED DATA (Données Initiales)
-- ============================================================

-- 4.1 Pays
INSERT INTO "Country" (id, name, code, "phoneCode") VALUES
('c1', 'République du Congo', 'CG', '+242');

-- 4.2 Villes
INSERT INTO "City" (id, name, code, "countryId") VALUES
('city-1', 'Brazzaville', 'BZV', 'c1'),
('city-2', 'Pointe-Noire', 'PNR', 'c1'),
('city-3', 'Dolisie', 'DOL', 'c1'),
('city-4', 'Nkayi', 'NKY', 'c1');

-- 4.3 Zones Brazzaville
INSERT INTO "Zone" (id, name, "cityId") VALUES
('z1', 'Centre-ville', 'city-1'),
('z2', 'Talangaï', 'city-1'),
('z3', 'Mfilou', 'city-1'),
('z4', 'Ouenzé', 'city-1'),
('z5', 'Poto-Poto', 'city-1'),
('z6', 'Makélékélé', 'city-1');

-- 4.4 Zones Pointe-Noire
INSERT INTO "Zone" (id, name, "cityId") VALUES
('z7', 'Centre-ville PNR', 'city-2'),
('z8', 'Mvou-Mvou', 'city-2'),
('z9', 'Tchimbamba', 'city-2');

-- 4.5 Paramètres système
INSERT INTO "SystemSetting" (id, key, value, type, description) VALUES
('s1', 'request_expiry_minutes', '30', 'number', 'Durée avant expiration d'une demande'),
('s2', 'otp_expiry_seconds', '600', 'number', 'Durée de validité d'un OTP (10 min)'),
('s3', 'otp_max_attempts', '3', 'number', 'Nombre max de tentatives OTP'),
('s4', 'max_delivery_photo_size_mb', '5', 'number', 'Taille max photo preuve (Mo)'),
('s5', 'commission_enabled', 'false', 'boolean', 'Activer les commissions (Phase 2)'),
('s6', 'default_delivery_amount', '1500', 'number', 'Frais livraison par défaut FCFA'),
('s7', 'fcfs_lock_timeout_ms', '5000', 'number', 'Timeout verrouillage FCFS (ms)'),
('s8', 'app_name', 'PSR PharmaFlow', 'string', 'Nom de l'application');

-- 4.6 Règle commission (0% au lancement)
INSERT INTO "CommissionRule" (id, name, description, "productPercent", "deliveryPercent", "fixedFee", "isActive", "effectiveFrom") VALUES
('cr1', 'Lancement Zero', 'Commission à 0% pour le lancement', 0.00, 0.00, 0.00, true, CURRENT_TIMESTAMP);

-- 4.7 Catégories produits
INSERT INTO "ProductCategory" (id, name, description) VALUES
('pc1', 'Antibiotiques', 'Médicaments antibactériens'),
('pc2', 'Antidouleurs', 'Analgésiques et antipyrétiques'),
('pc3', 'Cardiovasculaire', 'Médicaments pour le cœur et la tension'),
('pc4', 'Diabète', 'Insulines et antidiabétiques'),
('pc5', 'Vitamines', 'Compléments alimentaires'),
('pc6', 'Pédiatrie', 'Médicaments pour enfants'),
('pc7', 'Thermosensible', 'Produits nécessitant le froid'),
('pc8', 'Gastro-entérologie', 'Médicaments pour le système digestif'),
('pc9', 'Dermatologie', 'Médicaments pour la peau'),
('pc10', 'Neurologie', 'Médicaments pour le système nerveux');

-- ============================================================
-- 5. VUES (VIEWS) POUR LE DASHBOARD
-- ============================================================

-- Vue des demandes actives pour les grossistes (FCFS)
CREATE VIEW "v_active_requests" AS
SELECT
  r."id",
  r."reference",
  r."productName",
  r."quantity",
  r."dosage",
  r."notes",
  r."status",
  r."isUrgent",
  r."expiresAt",
  r."createdAt",
  p."name" as "pharmacyName",
  p."address" as "pharmacyAddress",
  c."name" as "cityName",
  z."name" as "zoneName",
  EXTRACT(EPOCH FROM (r."expiresAt" - CURRENT_TIMESTAMP))::INTEGER as "secondsRemaining"
FROM "Request" r
JOIN "Pharmacy" p ON r."pharmacyId" = p."id"
JOIN "City" c ON p."cityId" = c."id"
LEFT JOIN "Zone" z ON p."zoneId" = z."id"
WHERE r."status" = 'SEARCHING'
  AND r."expiresAt" > CURRENT_TIMESTAMP;

-- Vue des commandes avec détails complets
CREATE VIEW "v_orders_full" AS
SELECT
  o."id",
  o."reference",
  o."productAmount",
  o."deliveryAmount",
  o."commissionAmount",
  o."totalAmount",
  o."orderStatus",
  o."paymentStatus",
  o."deliveryStatus",
  o."createdAt",
  r."productName",
  r."quantity",
  p."name" as "pharmacyName",
  p."phone" as "pharmacyPhone",
  w."name" as "wholesalerName",
  w."phone" as "wholesalerPhone"
FROM "Order" o
JOIN "Request" r ON o."requestId" = r."id"
JOIN "Pharmacy" p ON o."pharmacyId" = p."id"
JOIN "Wholesaler" w ON o."wholesalerId" = w."id";

-- Vue des livraisons en cours
CREATE VIEW "v_active_deliveries" AS
SELECT
  d."id",
  d."status",
  d."deliveryType",
  d."assignedAt",
  d."acceptedAt",
  d."pickedUpAt",
  d."inTransitAt",
  d."deliveredAt",
  d."completedAt",
  o."reference" as "orderReference",
  o."totalAmount",
  dc."name" as "deliveryCompanyName",
  da."firstName" || ' ' || da."lastName" as "deliveryAgentName",
  da."phone" as "deliveryAgentPhone",
  p."name" as "pharmacyName",
  p."address" as "pharmacyAddress",
  w."name" as "wholesalerName",
  w."address" as "wholesalerAddress"
FROM "Delivery" d
JOIN "Order" o ON d."orderId" = o."id"
JOIN "DeliveryCompany" dc ON d."deliveryCompanyId" = dc."id"
LEFT JOIN "DeliveryAgent" da ON d."deliveryAgentId" = da."id"
JOIN "Pharmacy" p ON o."pharmacyId" = p."id"
JOIN "Wholesaler" w ON o."wholesalerId" = w."id"
WHERE d."status" NOT IN ('COMPLETED', 'FAILED', 'RETURNED');

-- ============================================================
-- 6. FONCTIONS & TRIGGERS
-- ============================================================

-- Fonction pour mettre à jour updatedAt automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updatedAt pour toutes les tables
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_city_updated_at BEFORE UPDATE ON "City"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_zone_updated_at BEFORE UPDATE ON "Zone"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pharmacy_updated_at BEFORE UPDATE ON "Pharmacy"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wholesaler_updated_at BEFORE UPDATE ON "Wholesaler"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_company_updated_at BEFORE UPDATE ON "DeliveryCompany"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_agent_updated_at BEFORE UPDATE ON "DeliveryAgent"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_request_updated_at BEFORE UPDATE ON "Request"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_order_updated_at BEFORE UPDATE ON "Order"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_updated_at BEFORE UPDATE ON "Delivery"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payment_updated_at BEFORE UPDATE ON "Payment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_fee_updated_at BEFORE UPDATE ON "DeliveryFee"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_commission_rule_updated_at BEFORE UPDATE ON "CommissionRule"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscription_updated_at BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_setting_updated_at BEFORE UPDATE ON "SystemSetting"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. RLS (Row Level Security) — Activation optionnelle
-- ============================================================

-- Activer RLS sur les tables sensibles (sans politique = bloqué pour user direct)
-- Prisma/Express contourne RLS car utilise le rôle postgres/service role

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pharmacy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wholesaler" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryCompany" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryAgent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Delivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. COMMENTS (Documentation inline)
-- ============================================================

COMMENT ON TABLE "User" IS 'Utilisateurs du système (admin, pharmacies, grossistes, livraison, livreurs)';
COMMENT ON TABLE "Request" IS 'Demandes de produits créées par les pharmacies — cœur du système FCFS';
COMMENT ON TABLE "Order" IS 'Commandes générées automatiquement après confirmation FCFS';
COMMENT ON TABLE "Delivery" IS 'Missions de livraison assignées aux entreprises et livreurs';
COMMENT ON TABLE "AuditLog" IS 'Journal immuable de toutes les actions sensibles';
COMMENT ON TABLE "CommissionRule" IS 'Règles de commission configurables par l'admin (0% au lancement)';
COMMENT ON TABLE "SystemSetting" IS 'Paramètres runtime modifiables sans redéploiement';

-- ============================================================
-- FIN DU FICHIER
-- ============================================================
