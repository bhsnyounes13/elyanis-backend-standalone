import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function printUnreachableAndExit(err: unknown): never {
  console.error(`
Database not reachable.

1. Start PostgreSQL locally and ensure DATABASE_URL in .env matches your server (user, password, database name).
2. Then run:
     npm run db:setup
   (or: npm run db:wait && npm run db:push && npm run db:seed)

Optional — Postgres via Docker only: npm run db:setup:docker
`);
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Underlying error: ${msg}`);
  process.exit(1);
}

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    printUnreachableAndExit(err);
  }

  try {
    const existing = await prisma.property.count();
    if (existing > 0) {
      console.log("[seed] Database already has data, skipping.");
      return;
    }

    const a1 = await prisma.agent.create({
      data: {
        name: "Yanis Benmoussa",
        photo:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        phone: "+213 555 123 456",
        email: "yanis@elyainis.com",
        bioEn: "Senior real estate consultant with 10+ years of experience in western Algeria.",
        bioFr:
          "Consultant immobilier senior avec plus de 10 ans d'expérience dans l'ouest algérien.",
        bioAr: "مستشار عقاري أول بخبرة تزيد عن 10 سنوات في غرب الجزائر.",
      },
    });

    const a2 = await prisma.agent.create({
      data: {
        name: "Amina Khelifi",
        photo:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        phone: "+213 555 789 012",
        email: "amina@elyainis.com",
        bioEn: "Specialist in luxury residential properties and commercial spaces.",
        bioFr: "Spécialiste des propriétés résidentielles de luxe et des espaces commerciaux.",
        bioAr: "متخصصة في العقارات السكنية الفاخرة والمساحات التجارية.",
      },
    });

    await prisma.property.createMany({
      data: [
        {
          titleEn: "Modern Villa with Garden",
          titleFr: "Villa Moderne avec Jardin",
          titleAr: "فيلا عصرية مع حديقة",
          descriptionEn: "A stunning modern villa featuring spacious rooms and a beautiful garden.",
          descriptionFr: "Une superbe villa moderne avec des pièces spacieuses et un beau jardin.",
          descriptionAr: "فيلا عصرية مذهلة تتميز بغرف واسعة وحديقة جميلة.",
          type: "sale",
          price: 45_000_000,
          city: "tlemcen",
          bedrooms: 5,
          bathrooms: 3,
          area: 350,
          images: [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
          ],
          amenities: ["Swimming Pool", "Garden", "Garage", "Central Heating"],
          featured: true,
          tags: ["featured"],
          agentId: a1.id,
        },
        {
          titleEn: "Luxury Apartment Downtown",
          titleFr: "Appartement de Luxe Centre-Ville",
          titleAr: "شقة فاخرة وسط المدينة",
          descriptionEn: "Elegant apartment in the heart of Ain Temouchent with modern amenities.",
          descriptionFr:
            "Appartement élégant au cœur d'Ain Temouchent avec des équipements modernes.",
          descriptionAr: "شقة أنيقة في قلب عين تموشنت مع مرافق حديثة.",
          type: "sale",
          price: 18_000_000,
          city: "ainTemouchent",
          bedrooms: 3,
          bathrooms: 2,
          area: 140,
          images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",
          ],
          amenities: ["Elevator", "Parking", "Air Conditioning"],
          featured: true,
          tags: ["new"],
          agentId: a2.id,
        },
      ],
    });

    await prisma.siteService.createMany({
      data: [
        {
          titleEn: "Property Sales",
          titleFr: "Vente Immobilière",
          titleAr: "بيع العقارات",
          descriptionEn: "Sell your property at the best market value.",
          descriptionFr: "Vendez votre bien au meilleur prix du marché.",
          descriptionAr: "بيع عقارك بأفضل قيمة.",
          iconKey: "building",
        },
        {
          titleEn: "Property Rental",
          titleFr: "Location Immobilière",
          titleAr: "تأجير العقارات",
          descriptionEn: "Find or list rental properties.",
          descriptionFr: "Trouvez ou louez un bien.",
          descriptionAr: "اعثر على عقار للإيجار.",
          iconKey: "handshake",
        },
      ],
    });

    console.log("[seed] Demo agents, properties and services inserted.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Can't reach database") ||
      msg.includes("P1001") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("connect")
    ) {
      printUnreachableAndExit(err);
    }
    console.error("[seed] Failed:", msg);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("Can't reach database") ||
      msg.includes("P1001") ||
      msg.includes("ECONNREFUSED")
    ) {
      printUnreachableAndExit(e);
    }
    console.error("[seed] Unexpected error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
