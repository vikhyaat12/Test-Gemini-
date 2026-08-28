import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __qc_prisma: PrismaClient | any;
}

// Only instantiate PrismaClient when DATABASE_URL is set. The commerce store
// (store.ts) checks `usePrisma = Boolean(process.env.DATABASE_URL)` before
// using this client, so when no database is configured (local dev / CI with
// in-memory fallback) the client is never accessed.

function createPrisma(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (!global.__qc_prisma) global.__qc_prisma = new PrismaClient();
    return global.__qc_prisma;
  }
  return new PrismaClient();
}

function getPrisma(): PrismaClient {
  return createPrisma();
}

// Export a client that either connects to the real database or throws if
// accidentally accessed without DATABASE_URL. The store module guards
// every call with `if (usePrisma)` so the throw should never fire.
export const prisma: PrismaClient = process.env.DATABASE_URL ? getPrisma() : ({} as PrismaClient);

export default prisma;
