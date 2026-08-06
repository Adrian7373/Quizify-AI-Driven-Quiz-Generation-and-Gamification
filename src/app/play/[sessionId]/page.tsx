import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AsyncPlayer from "./_components/AsyncPlayer";

interface PlayPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
    const { sessionId } = await params;

    // Fetch the session and the associated quiz questions
    const session = await prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: {
            quiz: {
                select: {
                    title: true,
                    questions: true,
                }
            }
        }
    });

    if (!session) {
        redirect("/join");
    }

    // Pass the data to our interactive client component
    return (
        <div className="min-h-screen bg-slate-900 font-inter">
            {session.mode === "ASYNC" ? (
                <AsyncPlayer
                    sessionId={session.id}
                    quizTitle={session.quiz.title}
                    questions={session.quiz.questions as any[]}
                />
            ) : (
                <div className="text-white text-center pt-20">
                    {/* We will build the Live component later! */}
                    <h1 className="text-2xl">Live Mode coming soon...</h1>
                </div>
            )}
        </div>
    );
}