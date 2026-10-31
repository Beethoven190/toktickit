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

// Seeded users for Lab 3 and Lab 4
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

  // 4. Seed sample tickets and actions taken
  const requesterUser = await prisma.user.findUnique({
    where: { email: "supanut.w@toktickit.local" },
  });
  const staffJohn = await prisma.user.findUnique({
    where: { email: "john.s@toktickit.local" },
  });
  const staffAlex = await prisma.user.findUnique({
    where: { email: "alex.t@toktickit.local" },
  });
  const catHardware = await prisma.category.findUnique({
    where: { name: "Hardware" },
  });
  const catNetwork = await prisma.category.findUnique({
    where: { name: "Network" },
  });
  const catSoftware = await prisma.category.findUnique({
    where: { name: "Software" },
  });
  const sysLaptop = await prisma.relatedSystem.findUnique({
    where: { name: "Corporate Laptop" },
  });
  const sysWifi = await prisma.relatedSystem.findUnique({
    where: { name: "Campus Wi-Fi" },
  });
  const sysVpn = await prisma.relatedSystem.findUnique({
    where: { name: "VPN" },
  });
  const sysEmail = await prisma.relatedSystem.findUnique({
    where: { name: "Email" },
  });

  if (requesterUser && staffJohn && staffAlex && catHardware && catNetwork && catSoftware && sysLaptop && sysWifi && sysVpn && sysEmail) {
    // Ticket 1: IN_PROGRESS with MULTIPLE Actions Taken by DIFFERENT staff (BR-02)
    const t1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000001",
        requesterId: requesterUser.id,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
        summary: "Laptop keyboard keys sticking (Spacebar and Enter)",
        description: "Multiple keys on the corporate laptop are unresponsive or sticking intermittently.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        ownerId: staffJohn.id,
      },
    });

    const t1ActionCount = await prisma.actionTaken.count({
      where: { ticketId: t1.id },
    });

    if (t1ActionCount === 0) {
      // Action 1: Performed by John Staff (Ticket Owner)
      await prisma.actionTaken.create({
        data: {
          ticketId: t1.id,
          actionDateTime: new Date(Date.now() - 3600000 * 4),
          description: "Performed diagnostic testing on keyboard matrix and ribbon cable connections.",
          result: "Identified mechanical key switch deformation under Spacebar and Enter keys.",
          performedById: staffJohn.id,
          followUpRequired: false,
          attachmentNotes: "See diagnostic_report.pdf",
        },
      });

      // Action 2: Performed by Alex Tech (Different IT Staff member - BR-02)
      await prisma.actionTaken.create({
        data: {
          ticketId: t1.id,
          actionDateTime: new Date(Date.now() - 3600000 * 2),
          description: "Disassembled laptop chassis, replaced keyboard module with OEM spare, and cleaned internal vents.",
          result: "Keyboard assembly successfully replaced and tested functional in BIOS and OS.",
          performedById: staffAlex.id,
          followUpRequired: true,
          followUpNote: "Check in with user after 24 hours of standard usage to ensure no key sticking recurs.",
          attachmentNotes: "replacement_sn_photo.jpg",
        },
      });
      console.log("Seeded multiple Actions Taken for TKT-2026-000001.");
    }

    // Ticket 2: NEW with ZERO Actions Taken (Clean empty state testing)
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {},
      create: {
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

    // Ticket 3: RESOLVED with ONE Action Taken
    const t3 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000003" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000003",
        requesterId: requesterUser.id,
        categoryId: catNetwork.id,
        relatedSystemId: sysVpn.id,
        summary: "VPN connection timeout during remote access",
        description: "VPN client reports connection timeout after entering 2FA credentials.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "RESOLVED",
        ownerId: staffJohn.id,
        resolutionSummary: "Reconfigured VPN client profile, reissued client certificates, and verified secure tunnel connectivity.",
      },
    });

    const t3ActionCount = await prisma.actionTaken.count({
      where: { ticketId: t3.id },
    });

    if (t3ActionCount === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: t3.id,
          actionDateTime: new Date(Date.now() - 3600000 * 8),
          description: "Renewed expired root CA cert in VPN client config and cleared routing table cache.",
          result: "Tunnel successfully established. Handshake latency within acceptable limits (18ms).",
          performedById: staffJohn.id,
          followUpRequired: false,
          attachmentNotes: "vpn_handshake_log.txt",
        },
      });
      console.log("Seeded single Action Taken for TKT-2026-000003.");
    }

    // Ticket 4: WAITING_FOR_REQUESTER with ONE Action Taken having followUpRequired = true
    const t4 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000004" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000004",
        requesterId: requesterUser.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysEmail.id,
        summary: "Email synchronization error in Outlook client",
        description: "Shared mailbox folders fail to sync new messages on desktop client.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "WAITING_FOR_REQUESTER",
        ownerId: staffAlex.id,
      },
    });

    const t4ActionCount = await prisma.actionTaken.count({
      where: { ticketId: t4.id },
    });

    if (t4ActionCount === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: t4.id,
          actionDateTime: new Date(Date.now() - 3600000 * 3),
          description: "Rebuilt local OST cache and updated Exchange profile settings.",
          result: "Cache rebuilt. Pending user confirmation on mobile and desktop synchronization.",
          performedById: staffAlex.id,
          followUpRequired: true,
          followUpNote: "Awaiting user response to confirm inbox is displaying today's new messages.",
          attachmentNotes: "sync_settings.png",
        },
      });
      console.log("Seeded Action Taken for TKT-2026-000004.");
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
