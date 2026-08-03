"use server"
import prisma from "@/lib/prisma";
import { waitForDatabaseConnection } from "@/lib/prisma-connection";

function getErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) return undefined
    if (!("code" in error)) return undefined
    const code = (error as { code?: unknown }).code
    return typeof code === "string" ? code : undefined
}

async function upsertAnonymousUsageWithRetry(visitorId: string, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await prisma.anonymousUsage.upsert({
                where: {
                    fingerprint: visitorId,
                },
                update: {},
                create: {
                    fingerprint: visitorId,
                },
                select: {
                    count: true,
                },
            });
        } catch (error) {
            const code = getErrorCode(error)
            if (code === "P1011") {
                await prisma.$disconnect().catch(() => undefined)
            }

            if (attempt === retries) {
                throw error
            }
        }
    }

    throw new Error("Anonymous usage upsert failed after retries")
}

export default async function handleAnonymousGeneration(formData: FormData, visitorId: string) {
    try {
        try {
            await waitForDatabaseConnection();
        } catch (usageError) {
            console.error("Database connection not ready.", {
                code: getErrorCode(usageError) ?? "UNKNOWN",
            })
            return { error: "Failed to generate Quiz", reason: "serverError" }
        }

        let existingUser;
        try {
            existingUser = await upsertAnonymousUsageWithRetry(visitorId)
        } catch (usageError) {
            console.error("Anonymous usage lookup failed.", {
                code: getErrorCode(usageError) ?? "UNKNOWN",
            })
            return { error: "Failed to generate Quiz", reason: "serverError" }
        }

        if (existingUser.count >= 5) {
            return { error: "Failed to generate quiz", reason: "limit" }
        }

        const quizType = formData.get("quizType") as string;
        const questionCount = formData.get("questionCount") as string;
        const inputType = formData.get("inputType") as string;

        const flaskFormData = new FormData();
        flaskFormData.append("quizType", quizType ?? "Multiple Choice");
        flaskFormData.append("questionCount", questionCount ?? "10");
        flaskFormData.append("inputType", inputType ?? "Text");

        if (inputType === "Text") {
            const text = formData.get("text");
            if (text) flaskFormData.append("text", text)
        } else if (inputType === "File") {
            const file = formData.get("file");
            if (file) flaskFormData.append("file", file); // Appends the raw File object

        } else if (inputType === "Image") {
            const image = formData.get("image");
            if (image) flaskFormData.append("image", image); // Appends the raw File object
        }

        const flaskRes = await fetch('http://127.0.0.1:5000/api/generate', {
            method: 'POST',
            body: flaskFormData,
        });

        if (!flaskRes.ok) {
            throw new Error('Flask AI microservice failed to generate quiz');
        }

        try {
            await prisma.anonymousUsage.update({
                where: {
                    fingerprint: visitorId
                },
                data: {
                    count: {
                        increment: 1
                    }
                }
            })
        } catch (usageError) {
            console.error("Anonymous usage increment failed.", {
                code: getErrorCode(usageError) ?? "UNKNOWN",
            })
        }

        const quizData = await flaskRes.json();

        return { quizData }
    } catch (error) {
        console.log(error)
        return { error: "Failed to generate Quiz", reason: "serverError" }
    }


}


export async function handleAuthenticatedGeneration(formData: FormData, userId: string) {
    try {

        try {
            await waitForDatabaseConnection();
        } catch (usageError) {
            console.error("Database connection not ready.", {
                code: getErrorCode(usageError) ?? "UNKNOWN",
            })
            return { error: "Failed to generate Quiz", reason: "serverError" }
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                aiCredits: true
            }
        })

        if (!user) return { error: "Failed to generate quiz. Please login to continue", reason: "noUser" }

        if (user?.aiCredits <= 0) return { error: "Failed to generate quiz. Not enough credits", reason: "credits" }

        const quizType = formData.get("quizType") as string;
        const questionCount = formData.get("questionCount") as string;
        const inputType = formData.get("inputType") as string;

        const flaskFormData = new FormData();
        flaskFormData.append("quizType", quizType ?? "Multiple Choice");
        flaskFormData.append("questionCount", questionCount ?? "10");
        flaskFormData.append("inputType", inputType ?? "Text");

        if (inputType === "Text") {
            const text = formData.get("text");
            if (text) flaskFormData.append("text", text)
        } else if (inputType === "File") {
            const file = formData.get("file");
            if (file) flaskFormData.append("file", file); // Appends the raw File object

        } else if (inputType === "Image") {
            const image = formData.get("image");
            if (image) flaskFormData.append("image", image); // Appends the raw File object
        }

        const flaskRes = await fetch('http://127.0.0.1:5000/api/generate', {
            method: 'POST',
            body: flaskFormData,
        });

        if (!flaskRes.ok) {
            throw new Error('Flask AI microservice failed to generate quiz');
        }

        try {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    aiCredits: {
                        decrement: 1
                    }
                }
            })
        } catch (usageError) {
            console.error("User credit deduction failed.", {
                code: getErrorCode(usageError) ?? "UNKNOWN",
            })
        }

        const quizData = await flaskRes.json();

        return { quizData }

    } catch (error) {
        console.log(error)
        return { error: "Failed to generate Quiz", reason: "serverError" }
    }
}