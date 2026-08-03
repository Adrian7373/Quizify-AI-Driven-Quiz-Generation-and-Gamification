import prisma from "@/lib/prisma";

function getErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) return undefined;
    if (!("code" in error)) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
}

function isTransientConnectionError(error: unknown): boolean {
    const code = getErrorCode(error);

    return code === "P1011" || code === "P1001";
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
            await prisma.anonymousUsage.count();
            return;
        } catch (error) {
            if (!isTransientConnectionError(error)) {
                throw error;
            }

            await prisma.$disconnect().catch(() => undefined);

            if (attempt === retries) {
                throw error;
            }

            await delay(baseDelayMs * (attempt + 1));
        }
    }
}
