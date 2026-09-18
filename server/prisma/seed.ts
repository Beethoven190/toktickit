import bcrypt from "bcryptjs";
import { getPrisma } from "../src/prisma.js";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const systems = [
  "Corporate Laptop",
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Printer",
];

// Seeded users for Lab 3
// Default password for all seeded users: Password123!
const users = [
  // Requesters (4 active, 1 with mustChangePassword=true, 1 inactive)
  {
    name: "Supanut Watthanasimakorn",
    email: "supanut.w@toktickit.local",
    role: "REQUESTER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "David Ice",
    email: "david.i@toktickit.local",
    role: "REQUESTER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Nitithorn Katkaew",
    email: "nitithorn.k@toktickit.local",
    role: "REQUESTER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Nara Kosiyaporn",
    email: "nara.k@toktickit.local",
    role: "REQUESTER" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Newbie Requester",
    email: "newbie.requester@toktickit.local",
    role: "REQUESTER" as const,
    isActive: true,
    mustChangePassword: true,
  },
  {
    name: "Metier Leviathan",
    email: "metier.l@toktickit.local",
    role: "REQUESTER" as const,
    isActive: false,
    mustChangePassword: false,
  },
  // IT Staff (3 active, 1 inactive)
  {
    name: "John Staff",
    email: "john.s@toktickit.local",
    role: "STAFF" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Sarah Connor",
    email: "sarah.c@toktickit.local",
    role: "STAFF" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Alex Tech",
    email: "alex.t@toktickit.local",
    role: "STAFF" as const,
    isActive: true,
    mustChangePassword: false,
  },
  {
    name: "Old Staff",
    email: "old.s@toktickit.local",
    role: "STAFF" as const,
    isActive: false,
    mustChangePassword: false,
  },
  // Administrator (1 active)
  {
    name: "System Administrator",
    email: "admin@toktickit.local",
    role: "ADMIN" as const,
    isActive: true,
    mustChangePassword: false,
  },
];

async function main() {
  const prisma = getPrisma();
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Categories
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded categories successfully:", categories);

  // 2. Seed Systems
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded related systems successfully:", systems);

  // 3. Seed Users
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
    });
  }
  console.log(`Seeded ${users.length} Users successfully.`);

  // 4. Seed sample tickets if empty or minimal
  const ticketCount = await prisma.ticket.count();
  if (ticketCount === 0) {
    const requesterUser = await prisma.user.findUnique({
      where: { email: "supanut.w@toktickit.local" },
    });
    const staffUser = await prisma.user.findUnique({
      where: { email: "john.s@toktickit.local" },
    });
    const catHardware = await prisma.category.findUnique({
      where: { name: "Hardware" },
    });
    const catNetwork = await prisma.category.findUnique({
      where: { name: "Network" },
    });
    const sysLaptop = await prisma.relatedSystem.findUnique({
      where: { name: "Corporate Laptop" },
    });
    const sysWifi = await prisma.relatedSystem.findUnique({
      where: { name: "Campus Wi-Fi" },
    });

    if (requesterUser && staffUser && catHardware && catNetwork && sysLaptop && sysWifi) {
      const t1 = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-2026-000001",
          requesterId: requesterUser.id,
          categoryId: catHardware.id,
          relatedSystemId: sysLaptop.id,
          summary: "Laptop keyboard keys sticking (Spacebar and Enter)",
          description: "Multiple keys on the corporate laptop are unresponsive or sticking intermittently.",
          requestedPriority: "MEDIUM",
          itPriority: "HIGH",
          currentStatus: "IN_PROGRESS",
          ownerId: staffUser.id,
        },
      });

      await prisma.publicComment.create({
        data: {
          ticketId: t1.id,
          authorId: requesterUser.id,
          content: "I also noticed the battery is draining faster than usual.",
        },
      });

      await prisma.internalNote.create({
        data: {
          ticketId: t1.id,
          authorId: staffUser.id,
          content: "Inspected hardware; replacement keyboard ordered from supplier.",
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-2026-000002",
          requesterId: requesterUser.id,
          categoryId: catNetwork.id,
          relatedSystemId: sysWifi.id,
          summary: "Cannot authenticate with 802.1X Campus Wi-Fi in Building 3",
          description: "Campus Wi-Fi drops connection repeatedly when roaming between APs in Building 3.",
          requestedPriority: "LOW",
          itPriority: "LOW",
          currentStatus: "NEW",
          ownerId: null,
        },
      });
      console.log("Seeded initial realistic tickets, comments, and notes.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
