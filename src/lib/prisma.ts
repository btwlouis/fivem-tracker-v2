import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(global as any).prisma) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).prisma = new PrismaClient();
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma = (global as any).prisma;
}

export default prisma;
