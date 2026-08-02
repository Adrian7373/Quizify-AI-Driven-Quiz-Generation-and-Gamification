"use server"
import prisma from "@/lib/prisma";

export default async function handleAnonymousGeneration(formData: FormData, visitorId: string) {
    try {

        const existingUser = await prisma.anonymousUsage.findUnique({
            where: {
                fingerprint: visitorId,
            },
            select: {
                fingerprint: true,
                count: true,
            },
        });

        if (existingUser) {
            if (existingUser.count >= 5) {
                console.log(existingUser.count)
                return { error: "Failed to generate quiz", reason: "limit" }
            }
        } else {
            await prisma.anonymousUsage.create({
                data: {
                    fingerprint: visitorId
                }
            })
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

        const quizData = await flaskRes.json();

        return { quizData }
    } catch (error) {
        console.log(error)
        return { error: "Failed to generate Quiz", reason: "serverError" }
    }


}