import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __uuPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.__uuPrisma) return globalForPrisma.__uuPrisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to create Prisma Client.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  globalForPrisma.__uuPrisma = prisma;
  return prisma;
}
