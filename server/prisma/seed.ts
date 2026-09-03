import { getPrisma } from "../src/prisma.js";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const requesters = [
  { name: "Jennifer Anderson", email: "jennifer.a@toktickit.local", isActive: true },
  { name: "David Lee", email: "david.l@toktickit.local", isActive: true },
  { name: "Sarah Johnson", email: "sarah.j@toktickit.local", isActive: true },
  { name: "Michael Brown", email: "michael.b@toktickit.local", isActive: true },
  { name: "Emily Davis", email: "emily.d@toktickit.local", isActive: false },
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

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req,
    });
  }
  console.log(`Seeded ${requesters.length} Development Requesters successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
