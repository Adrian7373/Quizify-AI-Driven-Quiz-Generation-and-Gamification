import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import QuestionBankControls from "./_components/QuestionBankControls";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankGrid from "./_components/QuestionBankGrid";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BankLoading from "./loading";

interface QuestionBankPageProps {
    searchParams: Promise<{ page?: string; search?: string; type?: string; }>;
}

// SKELETON

function BankSkeleton() {
    // Generate an array of 6 items to fill a 2-column grid nicely
    const skeletonItems = Array(6).fill(null);

    return (
        <div className="relative animate-pulse w-full">
            {/* List Controls Placeholder (Showing X of Y) */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>

            {/* Questions Grid Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skeletonItems.map((_, index) => (
                    <div
                        key={index}
                        className="p-5 rounded-xl border-2 border-slate-200 bg-white flex gap-4"
                    >
                        {/* Checkbox Placeholder */}
                        <div className="shrink-0 mt-1">
                            <div className="w-6 h-6 bg-slate-200 rounded flex-shrink-0"></div>
                        </div>

                        {/* Content Placeholder */}
                        <div className="min-w-0 flex-1">
                            {/* Quiz Title Line */}
                            <div className="h-3 w-32 bg-slate-200 rounded mb-3"></div>

                            {/* Question Text (Simulating 2 lines) */}
                            <div className="h-5 w-3/4 bg-slate-300 rounded mb-2"></div>
                            <div className="h-5 w-1/2 bg-slate-300 rounded mb-4"></div>

                            {/* Answer Block */}
                            <div className="h-11 w-full bg-slate-200 rounded-lg border border-slate-100"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls Placeholder */}
            <div className="flex items-center justify-center gap-4 mt-8">
                <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
            </div>
        </div>
    );
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