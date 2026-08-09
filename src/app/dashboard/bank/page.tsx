import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankClient from "./_components/QuestionBankClient";

export default async function QuestionBankPage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/");

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) appUser = userResponse.user;

    // Fetch all questions owned by this user, including the title of their parent quiz
    const allQuestions = await prisma.question.findMany({
        where: {
            quiz: { creatorId: authUser.id }
        },
        include: {
            quiz: { select: { title: true } }
        },
        orderBy: { quizId: 'desc' } // Groups questions from the same quiz together
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <NavBar user={appUser} />
            <main className="flex-1 pt-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-32">
                <QuestionBankClient questions={allQuestions} userId={authUser.id} />
            </main>
        </div>
    );
}