import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankClient from "./_components/QuestionBankClient";

interface QuestionBankPageProps {
    searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
    const { page, search } = await searchParams;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/");

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) appUser = userResponse.user;

    // --- Server-Side Pagination & Search Setup ---
    const PAGE_SIZE = 20;
    const currentPage = Math.max(1, parseInt(page || "1"));
    const skip = (currentPage - 1) * PAGE_SIZE;
    const searchTerm = search || "";

    // Build the Prisma where clause dynamically
    const whereClause: any = {
        quiz: { creatorId: authUser.id }
    };

    if (searchTerm) {
        whereClause.OR = [
            { questionText: { contains: searchTerm, mode: 'insensitive' } },
            { quiz: { title: { contains: searchTerm, mode: 'insensitive' } } }
        ];
    }

    // Run both the paginated data fetch AND the total count query simultaneously
    const [paginatedQuestions, totalQuestionsCount] = await Promise.all([
        prisma.question.findMany({
            where: whereClause,
            include: {
                quiz: { select: { title: true } }
            },
            orderBy: { quizId: 'desc' },
            skip,
            take: PAGE_SIZE
        }),
        prisma.question.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalQuestionsCount / PAGE_SIZE);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <NavBar user={appUser} />
            <main className="flex-1 pt-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-32">
                <QuestionBankClient
                    questions={paginatedQuestions}
                    userId={authUser.id}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalQuestionsCount}
                    initialSearch={searchTerm}
                />
            </main>
        </div>
    );
}