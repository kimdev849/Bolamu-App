import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n  🌱  Bolamu — Seed minimal');
  console.log('  ─────────────────────────────\n');

  // Supprimer dans l'ordre inverse des dépendances
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.requestResponse.deleteMany();
  await prisma.request.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.deliveryAgent.deleteMany();
  await prisma.deliveryCompany.deleteMany();
  await prisma.wholesaler.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.deliveryFee.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.systemSetting.deleteMany();

  // ─────────────────────────────────
  // 1. PAYS & VILLES
  // ─────────────────────────────────
  const congo = await prisma.country.create({
    data: { name: 'République du Congo', code: 'CG', phoneCode: '+242' },
  });

  const brazza = await prisma.city.create({
    data: { name: 'Brazzaville', code: 'BZV', countryId: congo.id },
  });
  const pnr = await prisma.city.create({
    data: { name: 'Pointe-Noire', code: 'PNR', countryId: congo.id },
  });
  const dolisie = await prisma.city.create({
    data: { name: 'Dolisie', code: 'DOL', countryId: congo.id },
  });

  const centreVille = await prisma.zone.create({
    data: { name: 'Centre-ville', cityId: brazza.id },
  });
  const talangai = await prisma.zone.create({
    data: { name: 'Talangaï', cityId: brazza.id },
  });
  await prisma.zone.create({ data: { name: 'Mfilou', cityId: brazza.id } });
  await prisma.zone.create({ data: { name: 'Ouenzé', cityId: brazza.id } });
  await prisma.zone.create({ data: { name: 'Poto-Poto', cityId: brazza.id } });
  await prisma.zone.create({ data: { name: 'Makélékélé', cityId: brazza.id } });

  console.log('  ✅  Géographie créée (1 pays, 3 villes, 6 zones)');

  // ─────────────────────────────────
  // 2. PARAMÈTRES SYSTÈME
  // ─────────────────────────────────
  const settings = [
    { key: 'request_expiry_minutes', value: '30', type: 'number', description: 'Durée avant expiration d\'une demande' },
    { key: 'otp_expiry_seconds', value: '600', type: 'number', description: 'Durée de validité d\'un OTP (10 min)' },
    { key: 'otp_max_attempts', value: '3', type: 'number', description: 'Nombre max de tentatives OTP' },
    { key: 'commission_enabled', value: 'false', type: 'boolean', description: 'Activer les commissions (Phase 2)' },
    { key: 'default_delivery_amount', value: '1500', type: 'number', description: 'Frais livraison par défaut FCFA' },
    { key: 'commission_percent', value: '10', type: 'number', description: 'Commission plateforme en %' },
    { key: 'commission_flat', value: '0', type: 'number', description: 'Commission fixe FCFA' },
    { key: 'subscription_basic_price', value: '25000', type: 'number', description: 'Prix abonnement Essentiel (BASIC)' },
    { key: 'subscription_premium_price', value: '50000', type: 'number', description: 'Prix abonnement Professionnel (PREMIUM)' },
    { key: 'subscription_enterprise_price', value: '100000', type: 'number', description: 'Prix abonnement Enterprise (ENTERPRISE)' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  console.log('  ✅  Paramètres système créés');

  // ─────────────────────────────────
  // 3. RÈGLE COMMISSION (0%)
  // ─────────────────────────────────
  await prisma.commissionRule.create({
    data: {
      name: 'Lancement Zero',
      description: 'Commission à 0% pour le lancement',
      productPercent: 0,
      deliveryPercent: 0,
      fixedFee: 0,
      isActive: true,
      effectiveFrom: new Date('2025-01-01'),
    },
  });

  console.log('  ✅  Règle commission créée (0%)');

  // ─────────────────────────────────
  // 4. CATÉGORIES & PRODUITS
  // ─────────────────────────────────
  const catAntibio = await prisma.productCategory.create({
    data: { name: 'Antibiotiques', description: 'Médicaments antibactériens' },
  });
  const catDouleur = await prisma.productCategory.create({
    data: { name: 'Antidouleurs', description: 'Analgésiques et antipyrétiques' },
  });
  const catCardio = await prisma.productCategory.create({
    data: { name: 'Cardiovasculaire', description: 'Médicaments pour le cœur et la tension' },
  });
  const catDiabete = await prisma.productCategory.create({
    data: { name: 'Diabète', description: 'Insulines et antidiabétiques' },
  });
  const catVitamines = await prisma.productCategory.create({
    data: { name: 'Vitamines', description: 'Compléments alimentaires' },
  });

  const produits = [
    { name: 'Amoxicilline 500mg', genericName: 'Amoxicilline', categoryId: catAntibio.id, dosage: '500mg', form: 'Comprimé', temperature: 'AMBIANT' as const, isPrescription: true },
    { name: 'Paracétamol 1g', genericName: 'Paracétamol', categoryId: catDouleur.id, dosage: '1g', form: 'Comprimé', temperature: 'AMBIANT' as const },
    { name: 'Ibuprofène 400mg', genericName: 'Ibuprofène', categoryId: catDouleur.id, dosage: '400mg', form: 'Comprimé', temperature: 'AMBIANT' as const },
    { name: 'Insuline Rapide 100UI/mL', genericName: 'Insuline', categoryId: catDiabete.id, dosage: '100UI/mL', form: 'Injectable', temperature: 'REFRIGERATED' as const, isPrescription: true },
    { name: 'Vitamine C 1000mg', genericName: 'Vitamine C', categoryId: catVitamines.id, dosage: '1000mg', form: 'Comprimé', temperature: 'AMBIANT' as const },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', categoryId: catCardio.id, dosage: '5mg', form: 'Comprimé', temperature: 'AMBIANT' as const, isPrescription: true },
  ];
  for (const p of produits) {
    await prisma.product.create({ data: p });
  }

  console.log('  ✅  Catalogue créé (6 catégories, 6 produits)');

  // ─────────────────────────────────
  // 5. UTILISATEURS
  // ─────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin@123', 10);
  const pharmaPwd = await bcrypt.hash('Pharma@123', 10);
  const whPwd = await bcrypt.hash('Wholesaler@123', 10);
  const deliveryPwd = await bcrypt.hash('Delivery@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@psr.com',
      password: adminPwd,
      firstName: 'Admin',
      lastName: 'PSR',
      phone: '+242061234567',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const pharmUser = await prisma.user.create({
    data: {
      email: 'pharmacie@test.com',
      password: pharmaPwd,
      firstName: 'Jean',
      lastName: 'Mbiock',
      phone: '+242061111111',
      role: 'PHARMACY_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const whUser = await prisma.user.create({
    data: {
      email: 'grossiste@test.com',
      password: whPwd,
      firstName: 'Paul',
      lastName: 'Biya',
      phone: '+242062222222',
      role: 'WHOLESALER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const delUser = await prisma.user.create({
    data: {
      email: 'livreur@test.com',
      password: deliveryPwd,
      firstName: 'Marie',
      lastName: 'Ngono',
      phone: '+242063333333',
      role: 'DELIVERY_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('  ✅  Utilisateurs créés (4 comptes)');

  // ─────────────────────────────────
  // 6. PHARMACIE
  // ─────────────────────────────────
  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: 'Pharmacie Centrale',
      registration: 'REG-PH-001',
      licenseNumber: 'LIC-2024-001',
      address: '123 Avenue de la Liberté',
      cityId: brazza.id,
      zoneId: centreVille.id,
      phone: '+242061111111',
      email: 'contact@pharmacie-centrale.cg',
      contactName: 'Dr. Jean Mbiock',
      contactPhone: '+242061111111',
      isVerified: true,
      isActive: true,
      rating: 4.8,
    },
  });

  // Lier l'utilisateur à la pharmacie
  await prisma.user.update({
    where: { id: pharmUser.id },
    data: { pharmacyId: pharmacy.id },
  });

  // ─────────────────────────────────
  // 7. GROSSISTE
  // ─────────────────────────────────
  const wholesaler = await prisma.wholesaler.create({
    data: {
      name: 'DistriPharm Congo',
      registration: 'REG-WH-001',
      licenseNumber: 'LIC-WH-2024-001',
      address: '200 Zone Industrielle',
      cityId: brazza.id,
      phone: '+242062222222',
      email: 'contact@distripharm.cg',
      contactName: 'Paul Biya',
      contactPhone: '+242062222222',
      isVerified: true,
      isActive: true,
      responseRate: 95,
      avgResponseTime: 120,
      rating: 4.5,
    },
  });

  await prisma.user.update({
    where: { id: whUser.id },
    data: { wholesalerId: wholesaler.id },
  });

  // ─────────────────────────────────
  // 8. ENTREPRISE DE LIVRAISON
  // ─────────────────────────────────
  const deliveryCo = await prisma.deliveryCompany.create({
    data: {
      name: 'Express Médical Congo',
      registration: 'REG-DC-001',
      address: '50 Rue du Port',
      cityId: brazza.id,
      phone: '+242063333333',
      email: 'contact@expressmedical.cg',
      contactName: 'Marie Ngono',
      paymentPhone: '+242063333333',
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.user.update({
    where: { id: delUser.id },
    data: { deliveryCompanyId: deliveryCo.id },
  });

  // ─────────────────────────────────
  // 9. LIVREUR
  // ─────────────────────────────────
  const agent = await prisma.deliveryAgent.create({
    data: {
      firstName: 'Robert',
      lastName: 'Nkwi',
      phone: '+242060000001',
      email: 'robert@expressmedical.cg',
      deliveryCompanyId: deliveryCo.id,
      isActive: true,
      isOnline: true,
    },
  });

  // Créer un compte user pour le livreur (relier via deliveryAgentId)
  await prisma.user.create({
    data: {
      email: 'robert@expressmedical.cg',
      password: await bcrypt.hash('Agent@123', 10),
      firstName: 'Robert',
      lastName: 'Nkwi',
      phone: '+242060000001',
      role: 'DRIVER',
      status: 'ACTIVE',
      deliveryAgentId: agent.id,
      deliveryCompanyId: deliveryCo.id,
    },
  });

  console.log('  ✅  Entités créées : 1 pharmacie, 1 grossiste, 1 livraison, 1 livreur');

  // ─────────────────────────────────
  // 10. FRAIS DE LIVRAISON
  // ─────────────────────────────────
  const fees = [
    { zoneId: centreVille.id, baseAmount: 1000, expressAmount: 2000, thermoAmount: 2500 },
    { zoneId: talangai.id, baseAmount: 1500, expressAmount: 2500, thermoAmount: 3000 },
  ];
  for (const f of fees) {
    await prisma.deliveryFee.create({ data: f });
  }

  console.log('  ✅  Frais de livraison créés (2 zones)');

  // ─────────────────────────────────
  // RÉSUMÉ
  // ─────────────────────────────────
  console.log('\n  ────────────────────────────────────');
  console.log('  📊  RÉSUMÉ DU PEUPLEMENT');
  console.log('  ────────────────────────────────────');
  const counts = {
    users: await prisma.user.count(),
    pharmacies: await prisma.pharmacy.count(),
    wholesalers: await prisma.wholesaler.count(),
    deliveryCompanies: await prisma.deliveryCompany.count(),
    deliveryAgents: await prisma.deliveryAgent.count(),
    products: await prisma.product.count(),
    categories: await prisma.productCategory.count(),
    requests: await prisma.request.count(),
    orders: await prisma.order.count(),
    deliveryFees: await prisma.deliveryFee.count(),
  };
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(15)} ${v}`);
  }
  console.log('  ────────────────────────────────────');
  console.log('\n  🔑  Comptes de test :');
  console.log('       admin@psr.com              / Admin@123');
  console.log('       pharmacie@test.com         / Pharma@123');
  console.log('       grossiste@test.com          / Wholesaler@123');
  console.log('       livreur@test.com            / Delivery@123');
  console.log('       robert@expressmedical.cg    / Agent@123');
  console.log('\n  🌱  Seed terminé avec succès !\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Erreur seed :', e);
    await prisma.$disconnect();
    process.exit(1);
  });
