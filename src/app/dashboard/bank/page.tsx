import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import QuestionBankControls from "./_components/QuestionBankControls";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankGrid from "./_components/QuestionBankGrid";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        <QuestionBankGrid
            questions={paginatedQuestions}
            userId={userId}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalQuestionsCount}
            initialSearch={searchTerm}
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

                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4ce0a3] transition-colors font-semibold text-sm mb-4">
                        <ArrowLeft className="w-4 h-4 text-black" /> Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">Question Bank</h1>
                            <p className="text-slate-500 mt-1">Mix and match your past questions to create a new quiz.</p>
                        </div>

                        {/* Interactive Client Component */}
                        <QuestionBankControls
                            initialSearch={search ?? ""}
                            initialType={type ?? "ALL"}
                        />
                    </div>
                </div>

                {/* Everything in here gets destroyed and rebuilt */}
                <Suspense
                    key={`${currentPage}-${type}-${search}`}
                    fallback={<BankSkeleton />}
                >
                    <BankData
                        currentPage={currentPage}
                        page={page ?? "1"}
                        search={search ?? ""}
                        userId={authUser.id}
                        type={type ?? "ALL"}
                    />
                </Suspense>

            </main>
        </div>
    );
}