import QuizModal, { QuizData } from "@/app/_components/QuizModal";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";

interface QuizPageProps {
    params: Promise<{ quizId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
    const { quizId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the full AppUser data so the NavBar has access to the user's quizzes
    let appUser = null;
    if (user) {
        const response = await getUser(user.id);
        if (response.user) {
            appUser = response.user;
        }
    }

    const quizData = await prisma.quiz.findUnique({
        where: {
            id: quizId,
            creatorId: user?.id,
        },
        select: {
            id: true,
            title: true,
            description: true,
            questions: true,
            difficulty: true
        },
    });

    return (
        <>
            <NavBar user={appUser} />
            <div className="pt-20 h-screen flex flex-col">
                <QuizModal isOpen={true} quizData={quizData as unknown as QuizData} user={appUser} />
            </div>
        </>
    )
}