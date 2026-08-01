// Nettoyage one-shot : supprime l'agent de test de vérification du déploiement prod
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const email = 'verify.deploy2@delivery.cg';
  const agent = await p.deliveryAgent.findFirst({ where: { email } });
  if (!agent) {
    console.log('Aucun agent de test trouvé (déjà propre)');
  } else {
    await p.user.deleteMany({ where: { deliveryAgentId: agent.id } });
    await p.deliveryAgent.delete({ where: { id: agent.id } });
    console.log('Agent de test supprimé (id: ' + agent.id + ')');
  }
  const left = await p.deliveryAgent.count();
  console.log('Agents restants: ' + left);
  await p.$disconnect();
}

main().catch((e) => {
  console.error('ERREUR:', e.message);
  process.exit(1);
});
