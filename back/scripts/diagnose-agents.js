/* Diagnostic lecture seule — création d'agents */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== USERS ===');
  const users = await p.user.findMany({ select: { email: true, phone: true, role: true, deliveryAgentId: true } });
  users.forEach((u) => console.log(`${u.role.padEnd(14)} | ${(u.email || '').padEnd(32)} | ${u.phone || '—'} | agent: ${u.deliveryAgentId ? 'OUI' : 'non'}`));

  console.log('\n=== AGENTS ===');
  const agents = await p.deliveryAgent.findMany({ select: { id: true, firstName: true, lastName: true, email: true, phone: true } });
  agents.forEach((a) => console.log(`${a.firstName} ${a.lastName} | ${a.email || '—'} | ${a.phone}`));

  // Doublons
  const phones = users.map((u) => u.phone).filter(Boolean);
  const agentPhones = agents.map((a) => a.phone).filter(Boolean);
  const emails = users.map((u) => u.email).filter(Boolean);
  const agentEmails = agents.map((a) => a.email).filter(Boolean);
  const dup = (arr) => [...new Set(arr.filter((x, i) => arr.indexOf(x) !== i))];
  console.log('\n=== DOUBLONS ===');
  console.log('phones users en double:', dup(phones).join(', ') || 'aucun');
  console.log('phones agents en double:', dup(agentPhones).join(', ') || 'aucun');
  console.log('emails users en double:', dup(emails).join(', ') || 'aucun');
  console.log('phones partagés user/agent:', dup([...phones, ...agentPhones]).join(', ') || 'aucun');
  console.log('emails partagés user/agent:', dup([...emails, ...agentEmails]).join(', ') || 'aucun');
}

main()
  .catch((e) => { console.error('ERREUR:', e.message); process.exitCode = 1; })
  .finally(async () => { await p.$disconnect(); });
