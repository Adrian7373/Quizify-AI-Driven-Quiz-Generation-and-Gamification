import prisma from "@/lib/prisma";

export function getErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) return undefined;
    if (!("code" in error)) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForDatabaseConnection(options?: {
    retries?: number;
    baseDelayMs?: number;
}) {
    const retries = options?.retries ?? 8;
    const baseDelayMs = options?.baseDelayMs ?? 500;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // A simple, lightweight query to force the connection pool open
            await prisma.anonymousUsage.count();
            return; // Success! Connection is ready.
        } catch (error) {
            // Force disconnect to clear any hanging broken connections
            await prisma.$disconnect().catch(() => undefined);

            // If we run out of retries, throw the final error
            if (attempt === retries) {
                throw error;
            }

            // Exponentially back off (500ms, 1000ms, 1500ms...)
            // We retry on ALL errors here because cold starts can throw 
            // generic network errors, not just explicit Prisma codes.
            await delay(baseDelayMs * (attempt + 1));
        }
    }
}