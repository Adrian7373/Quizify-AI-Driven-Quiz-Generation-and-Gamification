// src/app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // 1. Read the FormData coming from frontend
        const formData = await req.formData();

        const inputType = formData.get("inputType");
        const quizType = formData.get("quizType");
        const questionCount = formData.get("questionCount");

        // 2. Create a new FormData object to proxy to Flask
        const flaskFormData = new FormData();

        // Append the standard string variables (handling potential nulls safely)
        flaskFormData.append("inputType", (inputType as string) ?? "Text");
        flaskFormData.append("quizType", (quizType as string) ?? "Multiple Choice");
        flaskFormData.append("questionCount", (questionCount as string) ?? "5");

        // 3. CONDITIONAL SENDING: Only extract and append the specific input type
        if (inputType === "Text") {
            const text = formData.get("text");
            if (text) flaskFormData.append("text", text);

        } else if (inputType === "File") {
            const file = formData.get("file");
            if (file) flaskFormData.append("file", file); // Appends the raw File object

        } else if (inputType === "Image") {
            const image = formData.get("image");
            if (image) flaskFormData.append("image", image); // Appends the raw File object
        }

        // 4. Send the new FormData to Flask microservice
        const flaskRes = await fetch('http://127.0.0.1:5000/api/generate', {
            method: 'POST',
            body: flaskFormData,
        });

        if (!flaskRes.ok) {
            throw new Error('Flask AI microservice failed to generate quiz');
        }

        // This is the clean, type-safe JSON structure returned by Pydantic
        const quizData = await flaskRes.json();

        // 2. Save the Quiz and all nested Questions to database in a single transaction
        /*
        const savedQuiz = await prisma.quiz.create({
            data: {
                title: quizData.title,
                description: quizData.description,
                authorId: "cms7df07c00002khlm0y4ni46",
                questions: {
                    create: quizData.questions.map((q: any) => ({
                        questionText: q.questionText,
                        optionA: q.optionA,
                        optionB: q.optionB,
                        optionC: q.optionC,
                        optionD: q.optionD,
                        correctAnswer: q.correctAnswer,
                    })),
                },
            },
            include: {
                questions: true,
            },
        });
        */

        // 3. Return the newly created database record to the frontend
        return NextResponse.json(quizData, { status: 201 });

    } catch (error) {
        console.error('Error generating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to generate and save quiz' },
            { status: 500 }
        );
    }
}