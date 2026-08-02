import { PrismaClient } from '@/generated/prisma/client'

const prismaClientSingleton = () => {
    // Passing {} satisfies the 1 argument requirement for your custom output
    return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma