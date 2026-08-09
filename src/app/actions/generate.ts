"use server"
import prisma from "@/lib/prisma";
import { waitForDatabaseConnection } from "@/lib/prisma-connection";
import { Question } from "../_components/QuizModal";

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
        const difficulty = formData.get("difficulty") as string;

        const flaskFormData = new FormData();
        flaskFormData.append("quizType", quizType ?? "Multiple Choice");
        flaskFormData.append("questionCount", questionCount ?? "10");
        flaskFormData.append("inputType", inputType ?? "Text");
        flaskFormData.append("difficulty", difficulty ?? "normal")

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
        const difficulty = formData.get("difficulty") as string;

        const flaskFormData = new FormData();
        flaskFormData.append("quizType", quizType ?? "Multiple Choice");
        flaskFormData.append("questionCount", questionCount ?? "10");
        flaskFormData.append("inputType", inputType ?? "Text");
        flaskFormData.append("difficulty", difficulty ?? "normal");

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

        try {
            const quiz = await prisma.quiz.create({
                data: {
                    title: quizData.title,
                    description: quizData.description,
                    creator: { connect: { id: userId } },
                    difficulty: quizData.difficulty,
                    questions: {
                        create: quizData.questions.map((question: Question) => ({
                            questionText: question.questionText,
                            options: question.options,
                            correctAnswer: question.correctAnswer,
                            explanation: question.explanation,
                            timeLimitSeconds: question.timeLimitSeconds
                        }))
                    }
                },
            })

            quizData.id = quiz.id;

        } catch (error) {
            console.error("Failed to save quiz:", error);
            return { error: "Failed to save quiz." };
        }

        return { quizData }

    } catch (error) {
        console.log(error)
        return { error: "Failed to generate Quiz", reason: "serverError" }
    }
}

//Create async quiz session
export async function createAsyncSession(quizId: string, hostId: string, expiresAt: Date) {
    try {
        let joinCode = "";
        let isUnique = false;

        // Generate a random 6-digit PIN and ensure it doesn't already exist
        while (!isUnique) {
            joinCode = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await prisma.gameSession.findUnique({
                where: { joinCode }
            });
            if (!existing) {
                isUnique = true;
            }
        }

        const session = await prisma.gameSession.create({
            data: {
                joinCode,
                quizId,
                hostId,
                mode: "ASYNC",
                status: "IN_PROGRESS",
                expiresAt,
            }
        });

        return { session };
    } catch (error) {
        console.error("Failed to create session:", error);
        return { error: "Failed to create assignment session." };
    }
}

//Create live game session
export async function createLiveSession(quizId: string, hostId: string) {
    try {
        let joinCode = "";
        let isUnique = false;

        // Generate a random 6-digit PIN
        while (!isUnique) {
            joinCode = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await prisma.gameSession.findUnique({
                where: { joinCode }
            });
            if (!existing) isUnique = true;
        }

        const session = await prisma.gameSession.create({
            data: {
                joinCode,
                quizId,
                hostId,
                mode: "LIVE",
                status: "WAITING", // Starts in waiting room
                currentQuestionIndex: 0,
            }
        });

        return { session };
    } catch (error) {
        console.error("Failed to create live session:", error);
        return { error: "Failed to create live game." };
    }
}


//Generate game session class insights

export async function generateClassInsight(sessionId: string) {
    try {
        // 1. Fetch the full game session with questions and all student responses
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: {
                quiz: {
                    include: { questions: true }
                },
                participants: {
                    include: { responses: true }
                }
            }
        });

        console.log(session);

        if (!session) return { error: "Session not found." };
        if (session.classInsight) return { success: true, insight: session.classInsight }; // Already generated
        if (session.participants.length === 0) return { error: "No student data to analyze." };

        // 2. Aggregate the math: Which questions were hardest?
        const questionStats = session.quiz.questions.map(question => {
            // Find all responses for THIS specific question
            const responsesForQ = session.participants.flatMap(p =>
                p.responses.filter(r => r.questionId === question.id)
            );

            const totalAnswers = responsesForQ.length;
            const correctAnswers = responsesForQ.filter(r => r.isCorrect).length;
            const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 100;

            return {
                questionText: question.questionText,
                correctAnswer: question.correctAnswer,
                accuracy: Math.round(accuracy),
                totalAnswers
            };
        });

        // 3. Filter for questions where accuracy was below 60%, sorted by hardest first
        const struggleQuestions = questionStats
            .filter(q => q.accuracy < 60)
            .sort((a, b) => a.accuracy - b.accuracy);

        if (struggleQuestions.length === 0) {
            const perfectInsight = "Your class performed exceptionally well across the board! No significant conceptual gaps were detected.";
            await prisma.gameSession.update({
                where: { id: sessionId },
                data: { classInsight: perfectInsight }
            });
            return { success: true, insight: perfectInsight };
        }

        // 4. Send to your Python Flask/Django Microservice
        const pythonApiUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000/api/insights';

        const aiResponse = await fetch(pythonApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quizTitle: session.quiz.title,
                struggleQuestions: struggleQuestions.slice(0, 3) // Only send the top 3 hardest to save tokens
            })
        });

        if (!aiResponse.ok) throw new Error("Python API failed");
        const aiData = await aiResponse.json();

        // 5. Save the generated string to Prisma
        await prisma.gameSession.update({
            where: { id: sessionId },
            data: { classInsight: aiData.insight }
        });

        return { success: true, insight: aiData.insight };

    } catch (error) {
        console.error("Failed to generate insight:", error);
        return { error: "Failed to generate class insights." };
    }
}