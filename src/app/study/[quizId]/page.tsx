import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import FlashcardClient from "./_components/FlashCardClient";

interface StudyPageProps {
    params: Promise<{ id: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            questions: true
        }
    });

    if (!quiz || quiz.questions.length === 0) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-inter">
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-12">
                <FlashcardClient quiz={quiz} questions={quiz.questions} />
            </main>
        </div>
    );
}