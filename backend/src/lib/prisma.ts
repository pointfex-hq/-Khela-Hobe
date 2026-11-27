import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
  });
}

const existingClient = globalForPrisma.prisma;
const isStaleDevClient =
  Boolean(existingClient) &&
  (!('tournamentInterest' in (existingClient as object)) ||
    !('ticketCoupon' in (existingClient as object)) ||
    !('equipmentContribution' in (existingClient as object)) ||
    !('verificationOtp' in (existingClient as object)) ||
    !('userRating' in (existingClient as object)) ||
    !('organizerSettlement' in (existingClient as object)));

if (isStaleDevClient && existingClient) {
  existingClient.$disconnect().catch(() => {});
}

export const prisma =
  existingClient && !isStaleDevClient ? existingClient : createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
