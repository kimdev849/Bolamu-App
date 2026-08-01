/* Nettoyage : supprime les agents de livraison sans compte utilisateur lié.
   Ces agents orphelins proviennent de l'ancien code (création agent + user sans
   transaction) où l'échec du user.create laissait un agent sans compte de connexion. */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const agents = await p.deliveryAgent.findMany({
    include: { user: { select: { id: true } } },
  });

  const orphans = agents.filter((a) => !a.user);
  console.log(`Agents au total : ${agents.length}`);
  console.log(`Agents orphelins (sans compte utilisateur) : ${orphans.length}`);

  for (const a of orphans) {
    console.log(`  → suppression : ${a.firstName} ${a.lastName} (${a.email || a.phone})`);
    await p.deliveryAgent.delete({ where: { id: a.id } });
  }

  if (orphans.length === 0) console.log('Rien à supprimer — tous les agents ont un compte utilisateur.');
  else console.log(`✅ ${orphans.length} agent(s) orphelin(s) supprimé(s).`);
}

main()
  .catch((e) => { console.error('ERREUR:', e.message); process.exitCode = 1; })
  .finally(async () => { await p.$disconnect(); });
