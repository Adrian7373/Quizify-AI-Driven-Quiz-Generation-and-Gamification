import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@/generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const prismaClientSingleton = () => {
    const pool = new Pool({
        connectionString,
        max: 10,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
        ssl: {
            rejectUnauthorized: false,
        },
    })

    return new PrismaClient({
        adapter: new PrismaPg(pool),
    })
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    prismaConfiguredWithPgAdapter: boolean | undefined
}

export const prisma =
    globalForPrisma.prisma && globalForPrisma.prismaConfiguredWithPgAdapter
        ? globalForPrisma.prisma
        : prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
    globalForPrisma.prismaConfiguredWithPgAdapter = true
}

export default prisma