import { getPrisma } from "../src/prisma.js";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const requesters = [
  { name: "Supanut Watthanasimakorn", email: "supanut.w@toktickit.local", isActive: true },
  { name: "David Ice", email: "david.i@toktickit.local", isActive: true },
  { name: "Nitithorn Katkaew", email: "nitithorn.k@toktickit.local", isActive: true },
  { name: "Nara Kosiyaporn", email: "nara.k@toktickit.local", isActive: true },
  { name: "Metier Leviathan", email: "metier.l@toktickit.local", isActive: false },
];

async function main() {
  const prisma = getPrisma();

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded categories successfully:", categories);

  // Clean up old simulated accounts if needed
  await prisma.requesterUser.deleteMany({
    where: {
      email: {
        notIn: requesters.map((r) => r.email),
      },
    },
  });

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req,
    });
  }
  console.log(`Seeded ${requesters.length} Development Requesters successfully:`, requesters.map(r => r.name));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
