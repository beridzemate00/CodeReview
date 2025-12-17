import { PrismaClient } from '../../generated/prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create Prisma client with Accelerate extension for cloud database
// Note: dotenv must be loaded before this file is imported (done in index.ts)
const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;
