/* Nettoyage : supprime les agents de test par téléphone + tous les agents orphelins (sans user lié) */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. Supprimer les agents de test par téléphone exact
  const testPhones = ['+24291919191', '+24290909090'];
  for (const phone of testPhones) {
    const agent = await p.deliveryAgent.findUnique({ where: { phone } });
    if (agent) {
      await p.deliveryAgent.delete({ where: { id: agent.id } });
      console.log(`  → agent de test supprimé : ${agent.firstName} ${agent.lastName} (${phone})`);
    }
  }

  // 2. Supprimer tous les agents orphelins (sans compte utilisateur lié)
  const agents = await p.deliveryAgent.findMany({ include: { user: { select: { id: true } } } });
  const orphans = agents.filter((a) => !a.user);
  for (const a of orphans) {
    await p.deliveryAgent.delete({ where: { id: a.id } });
    console.log(`  → agent orphelin supprimé : ${a.firstName} ${a.lastName} (${a.email || a.phone})`);
  }

  // 3. Vérification finale
  const remaining = await p.deliveryAgent.findMany({ include: { user: { select: { id: true } } }, select: { firstName: true, lastName: true, email: true, phone: true, user: true } });
  console.log('\nAgents restants :');
  remaining.forEach((a) => console.log(`  ${a.firstName} ${a.lastName} | ${a.email || '—'} | ${a.phone} | user: ${a.user ? 'OUI' : 'NON'}`));
}

main()
  .catch((e) => { console.error('ERREUR:', e.message); process.exitCode = 1; })
  .finally(async () => { await p.$disconnect(); });
