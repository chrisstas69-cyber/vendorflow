import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Singleton Prisma client — required for Vercel serverless connection reuse */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export function isHostedDatabaseUrl(url?: string): boolean {
  const value = url ?? process.env.DATABASE_URL ?? '';
  if (!value || value.startsWith('file:')) return false;
  return (
    value.startsWith('postgresql://') ||
    value.startsWith('postgres://') ||
    value.includes('neon.tech')
  );
}
