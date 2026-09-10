import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankClient from "./_components/QuestionBankClient";
import { Suspense } from "react";

interface QuestionBankPageProps {
    searchParams: Promise<{ page?: string; search?: string; type?: string; }>;
}

// SKELETON

function BankSkeleton() {
    return (
        <div></div>
    )
}


// ENGINE

async function BankData({ currentPage, page, search, type, userId }: { currentPage: number, page: string, search: string, type: string, userId: string }) {

    // --- Server-Side Pagination & Search Setup ---
    const PAGE_SIZE = 20;
    const skip = (currentPage - 1) * PAGE_SIZE;
    const searchTerm = search || "";
    const questionType = type || "ALL";

    // Build the Prisma where clause dynamically
    const whereClause: any = {
        quiz: { creatorId: userId }
    };

    if (questionType !== "ALL") {
        whereClause.questionType = questionType;
    }

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
        <QuestionBankClient
            questions={paginatedQuestions}
            userId={userId}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalQuestionsCount}
            initialSearch={searchTerm}
            initialType={questionType}
        />
    )
}

export default async function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
    const { page, search, type } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1"));

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        throw new Error("Error accessing page!")
    }

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) appUser = userResponse.user;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <NavBar user={appUser} />
            <main className="flex-1 pt-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-32">
                <Suspense
                    key={`${currentPage}-${type}-${search}`} fallback={<BankSkeleton />}
                >
                    <BankData currentPage={currentPage} page={page ?? "1"} search={search ?? ""} userId={authUser.id} type={type ?? "ALL"} />
                </Suspense>
            </main>
        </div>
    );
}