import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, FileQuestion, Layers, PlayCircle, Trophy, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import EndSessionButton from "./_components/EndSessionButton";
import ActiveLiveWidget from "../_components/ActiveLiveWidget";
import DeleteSessionButton from "./_components/DeleteSessionButton";
import GenerateNewButton from "./_components/GenerateNewButton";
import CopyLinkButton from "./_components/CopyLinkButton";
import QuizCard from "./_components/QuizCard";
import RewardTracker from "./_components/RewardTracker";
import StreakWidget from "./_components/StreakWidget";
import Pagination from "./_components/Pagination";

interface DashboardProps {
    searchParams: Promise<{ tab?: string, page?: string }>;
}

type UserRole = "TEACHER" | "STUDENT";
const ITEMS_PER_PAGE = 9;

// ==========================================
// 1. LOADING SKELETONS
// ==========================================

function DashboardLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-48 flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse shrink-0" />
                    </div>
                    <div className="space-y-2 mb-auto">
                        <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
                        <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-4 w-20 bg-slate-100 rounded ml-auto animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function AssignmentsSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col xsm:flex-row items-start xsm:items-center gap-4 sm:gap-5 w-full">
                        <div className="bg-slate-100 rounded-xl w-full xsm:w-[130px] h-[92px] shrink-0 animate-pulse border border-slate-200" />
                        <div className="w-full space-y-3">
                            <div className="h-6 w-3/4 sm:w-1/2 bg-slate-200 rounded-md animate-pulse" />
                            <div className="flex gap-4">
                                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        <div className="h-11 flex-1 sm:w-32 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-11 w-11 bg-rose-100 rounded-lg animate-pulse shrink-0" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ReportsSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full">
                        <div className="bg-slate-100 p-3 sm:px-4 sm:py-3 rounded-lg shrink-0 w-12 h-12 sm:w-16 sm:h-16 animate-pulse" />
                        <div className="w-full space-y-2">
                            <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                            <div className="flex gap-4">
                                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="h-10 w-full sm:w-32 bg-slate-200 rounded-lg animate-pulse shrink-0" />
                </div>
            ))}
        </div>
    );
}

function getTabSkeleton(tab: string) {
    switch (tab) {
        case "assignments": return <AssignmentsSkeleton />;
        case "reports": return <ReportsSkeleton />;
        case "quizzes":
        default: return <DashboardLoading />;
    }
}


// ==========================================
// 2. DATA FETCHING COMPONENT (Wrapped in Suspense)
// ==========================================

async function TabContent({ currentTab, authUser, skip, currentPage, userRole }: {
    currentTab: string,
    authUser: any,
    skip: number,
    currentPage: number,
    userRole: UserRole
}) {

    // --- TAB 1: QUIZZES ---
    if (currentTab === "quizzes") {
        const whereClause = { creatorId: authUser.id, isDeleted: false }
        const [quizzes, totalCount] = await prisma.$transaction([
            prisma.quiz.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: ITEMS_PER_PAGE,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    difficulty: true,
                    createdAt: true,
                    _count: { select: { questions: true, sessions: true } }
                }
            }),
            prisma.quiz.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        if (quizzes.length === 0) {
            return (
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                        <FileQuestion className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Your library is empty</h3>
                    <p className="text-slate-500 mt-2 mb-6 max-w-md text-sm sm:text-base">
                        You haven't created any quizzes yet. Click the "Generate Quiz" button to build your first AI-powered assessment.
                    </p>
                </div>
            );
        }

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            userId={authUser.id}
                            userRole={userRole}
                        />
                    ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} tab={currentTab} />
            </>
        );
    }

    // --- TAB 2: ACTIVE ASSIGNMENTS ---
    if (currentTab === "assignments") {
        const whereClause = {
            hostId: authUser.id,
            status: "IN_PROGRESS" as const,
            mode: "ASYNC" as const,
            NOT: { joinCode: { startsWith: "PRAC-" } },
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }

        const [activeSessions, totalCount] = await prisma.$transaction([
            prisma.gameSession.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    quiz: { select: { title: true } },
                    _count: { select: { participants: true } }
                }
            }),
            prisma.gameSession.count({ where: whereClause })
        ]);

        if (activeSessions.length === 0) {
            return (
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center">
                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                        <PlayCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">No active assignments</h3>
                    <p className="text-slate-500 mt-2 mb-6 max-w-md text-sm sm:text-base">You don't have any running homework sessions. Open a quiz from your library and click "Assign" to generate a Game PIN.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {activeSessions.map((session) => (
                    <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-300 transition-colors">
                        <div className="flex flex-col xsm:flex-row items-start xsm:items-center gap-4 sm:gap-5 w-full">
                            <div className="bg-slate-100 p-3 rounded-xl text-center w-full xsm:w-auto min-w-[130px] shrink-0 flex flex-col justify-center border border-slate-200 shadow-inner">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Game PIN</p>
                                <p className="text-2xl font-black text-slate-900 tracking-widest">{session.joinCode}</p>
                                <CopyLinkButton joinCode={session.joinCode} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{session.quiz.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1.5 shrink-0"><Users className="w-4 h-4" /> {session._count.participants} Joined</span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <Clock className="w-4 h-4" />
                                        {session.expiresAt ? `Due ${format(new Date(session.expiresAt), 'MMM d, h:mm a')}` : 'No due date'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                            <Link href={`/dashboard/reports/${session.id}`} className="flex-1 sm:flex-none flex items-center justify-center text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg transition-colors">
                                View Progress
                            </Link>
                            <div className="shrink-0 flex items-center justify-center">
                                <EndSessionButton sessionId={session.id} hostId={authUser.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // --- TAB 3: COMPLETED REPORTS ---
    if (currentTab === "reports") {
        const whereClause = {
            hostId: authUser.id,
            NOT: { joinCode: { startsWith: "PRAC-" } },
            OR: [
                { status: "FINISHED" as const },
                {
                    status: "IN_PROGRESS" as const,
                    mode: "ASYNC" as const,
                    expiresAt: { lte: new Date() }
                }
            ]
        }

        const [completedSessions, totalCount] = await prisma.$transaction([
            prisma.gameSession.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    quiz: { select: { title: true } },
                    _count: { select: { participants: true } }
                }
            }),
            prisma.gameSession.count({ where: whereClause })
        ]);

        if (completedSessions.length === 0) {
            return (
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Trophy className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">No completed reports</h3>
                    <p className="text-slate-500 mt-2 mb-6 max-w-md text-sm sm:text-base">
                        When an active assignment ends, the final report with grades and leaderboards will appear here.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {completedSessions.map((session) => (
                    <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                            <div className="bg-slate-50 border border-slate-100 p-3 sm:px-4 sm:py-3 rounded-lg text-center shrink-0">
                                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 mx-auto" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-slate-800 line-clamp-2">{session.quiz.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {session._count.participants} Played
                                    </span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Ended {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                            <Link href={`/dashboard/reports/${session.id}`} className="flex-1 sm:flex-none flex items-center justify-center text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg transition-colors text-sm sm:text-base">
                                View Final Grades
                            </Link>
                            <div className="shrink-0">
                                <DeleteSessionButton sessionId={session.id} hostId={authUser.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
}


// ==========================================
// 3. MAIN PAGE SHELL (Loads Instantly)
// ==========================================

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const { tab, page } = await searchParams;
    const currentTab = tab || "quizzes";

    const currentPage = Number(page) || 1;
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Type Guard to satisfy TypeScript (Middleware handles the actual redirect)
    if (!authUser) {
        throw new Error("Unauthorized");
    }

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) {
        appUser = userResponse.user;
    }

    let userRole: UserRole = "STUDENT";
    if (appUser?.id) {
        const { role } = await prisma.user.findUnique({
            where: { id: appUser.id },
            select: { role: true }
        }) || {};

        if (role) userRole = role as UserRole;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            <NavBar user={appUser} />
            <StreakWidget streak={appUser?.currentStreak ?? 0} />
            <RewardTracker userId={authUser.id} />
            <ActiveLiveWidget userId={authUser.id} />

            <main className="flex-1 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-12">

                {/* Responsive Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-5 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">My Quizzes</h1>
                        <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage, host, and assign your generated content.</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Link
                            href="/dashboard/bank"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm sm:text-base rounded-xl border border-indigo-100 transition-all sm:hover:scale-105 shrink-0"
                        >
                            <Layers className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span className="whitespace-nowrap">Question Bank</span>
                        </Link>
                        <GenerateNewButton userId={authUser.id} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <Link
                        href="?tab=quizzes"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 shrink-0 ${currentTab === 'quizzes' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        My Library
                    </Link>
                    <Link
                        href="?tab=assignments"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 shrink-0 ${currentTab === 'assignments' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Assignments
                    </Link>
                    <Link
                        href="?tab=reports"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 shrink-0 ${currentTab === 'reports' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Completed Reports
                    </Link>
                </div>

                {/* 🚨 THE SUSPENSE BOUNDARY 🚨 */}
                <Suspense key={currentTab} fallback={getTabSkeleton(currentTab)}>
                    <TabContent
                        currentTab={currentTab}
                        authUser={authUser}
                        skip={skip}
                        currentPage={currentPage}
                        userRole={userRole}
                    />
                </Suspense>

            </main>
        </div>
    );
}