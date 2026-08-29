import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __qc_prisma: PrismaClient | any;
}

function createPrisma(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (!global.__qc_prisma) global.__qc_prisma = new PrismaClient();
    return global.__qc_prisma;
  }
  return new PrismaClient();
}

function createSafeFallbackClient(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (typeof prop === "string") {
        return new Proxy({}, {
          get(_mTarget, method) {
            return async () => {
              throw new Error(`Prisma operation ${String(prop)}.${String(method)} called but DATABASE_URL is not set.`);
            };
          }
        });
      }
      return undefined;
    }
  });
}

export const prisma: PrismaClient = process.env.DATABASE_URL ? createPrisma() : createSafeFallbackClient();

export default prisma;
