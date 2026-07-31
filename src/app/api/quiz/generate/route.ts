// src/app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { text, authorId, questionCount } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Source text is required' }, { status: 400 });
        }

        // 1. Call your running Flask microservice
        const flaskRes = await fetch('http://127.0.0.1:5000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, questionCount }),
        });

        if (!flaskRes.ok) {
            throw new Error('Flask AI microservice failed to generate quiz');
        }

        // This is the clean, type-safe JSON structure returned by Pydantic
        const quizData = await flaskRes.json();

        // 2. Save the Quiz and all nested Questions to SQLite in a single transaction
        const savedQuiz = await prisma.quiz.create({
            data: {
                title: quizData.title,
                description: quizData.description,
                authorId: authorId, // Pass a user ID from frontend or a demo user ID
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
                questions: true, // Include the saved questions in the response back to client
            },
        });

        // 3. Return the newly created database record to the frontend
        return NextResponse.json(savedQuiz, { status: 201 });

    } catch (error) {
        console.error('Error generating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to generate and save quiz' },
            { status: 500 }
        );
    }
}