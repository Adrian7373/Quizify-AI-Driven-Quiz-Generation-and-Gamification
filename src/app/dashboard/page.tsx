import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import Link from "next/link";
import { BrainCircuit, Calendar, CheckCircle2, Clock, FileQuestion, PlayCircle, Trophy, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import EndSessionButton from "./_components/EndSessionButton";
import ActiveLiveWidget from "../_components/ActiveLiveWidget";
import DeleteSessionButton from "./_components/DeleteSessionButton";

interface DashboardProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const { tab } = await searchParams;
    const currentTab = tab || "quizzes";

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // 1. Strict Role Separation: Kick out anonymous users instantly
    if (!authUser) {
        redirect("/");
    }

    // 2. Fetch the AppUser for the NavBar
    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) {
        appUser = userResponse.user;
    }

    // 3. We only fetch the data required for the currently active tab.
    let quizzes: any[] = [];
    let activeSessions: any[] = [];
    let completedSessions: any[] = [];

    if (currentTab === "quizzes") {
        quizzes = await prisma.quiz.findMany({
            where: { creatorId: authUser.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                createdAt: true,
                _count: { select: { questions: true, sessions: true } }
            }
        });
    } else if (currentTab === "assignments") {
        activeSessions = await prisma.gameSession.findMany({
            where: {
                hostId: authUser.id,
                status: "IN_PROGRESS",
                mode: "ASYNC"
            },
            orderBy: { createdAt: 'desc' },
            include: {
                quiz: { select: { title: true } },
                _count: { select: { participants: true } }
            }
        });
    } else if (currentTab === "reports") {
        // 2. Fetch FINISHED sessions
        completedSessions = await prisma.gameSession.findMany({
            where: {
                hostId: authUser.id,
                status: "FINISHED" // Only get finished sessions
            },
            orderBy: { createdAt: 'desc' },
            include: {
                quiz: { select: { title: true } },
                _count: { select: { participants: true } }
            }
        });
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar user={appUser} />
            <ActiveLiveWidget userId={authUser.id} />

            <main className="flex-1 pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Quizzes</h1>
                        <p className="text-slate-500 mt-1">Manage, host, and assign your generated content.</p>
                    </div>

                    <Link
                        href="/"
                        className="hidden sm:flex items-center gap-2 bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900 px-5 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                        <BrainCircuit className="w-5 h-5" />
                        Generate New
                    </Link>
                </div>

                <div className="flex gap-6 border-b border-slate-200 mb-8">
                    <Link
                        href="?tab=quizzes"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${currentTab === 'quizzes' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        My Library
                    </Link>
                    <Link
                        href="?tab=assignments"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${currentTab === 'assignments' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Assignments
                    </Link>
                    <Link
                        href="?tab=reports"
                        className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${currentTab === 'reports' ? 'border-[#4ce0a3] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Completed Reports
                    </Link>
                </div>

                {/* --- TAB 1: QUIZZES --- */}
                {currentTab === "quizzes" && (
                    quizzes.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                <FileQuestion className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800">No quizzes yet</h3>
                            <p className="text-slate-500 mt-2 mb-6 max-w-md">You haven't generated any assessments. Head over to the generator to turn your study materials into interactive quizzes.</p>
                            <Link href="/" className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                                Create your first quiz
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map((quiz) => (
                                <Link
                                    href={`/quiz/${quiz.id}`}
                                    key={quiz.id}
                                    className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-[#4ce0a3] transition-all duration-300 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-[#4ce0a3] transition-colors">
                                            {quiz.title}
                                        </h3>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${quiz.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                            quiz.difficulty === 'normal' ? 'bg-blue-100 text-blue-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                                        {quiz.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <FileQuestion className="w-4 h-4" />
                                            {quiz._count.questions} Qs
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            {quiz._count.sessions} Plays
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <Calendar className="w-4 h-4" />
                                            {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                )}

                {/* --- TAB 2: ACTIVE ASSIGNMENTS --- */}
                {currentTab === "assignments" && (
                    activeSessions.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
                            <div className="bg-amber-100 p-4 rounded-full mb-4">
                                <PlayCircle className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800">No active assignments</h3>
                            <p className="text-slate-500 mt-2 mb-6 max-w-md">You don't have any running homework sessions. Open a quiz from your library and click "Assign" to generate a Game PIN.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {activeSessions.map((session) => (
                                <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-300 transition-colors">

                                    <div className="flex items-center gap-5">
                                        {/* PIN Display */}
                                        <div className="bg-slate-100 px-4 py-3 rounded-lg text-center min-w-[120px]">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Join PIN</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-widest">{session.joinCode}</p>
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{session.quiz.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {session._count.participants} Joined</span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {session.expiresAt ? `Due ${format(new Date(session.expiresAt), 'MMM d, h:mm a')}` : 'No due date'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Link href={`/dashboard/reports/${session.id}`} className="flex-1 sm:flex-none text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg transition-colors">
                                            View Progress
                                        </Link>
                                        <EndSessionButton sessionId={session.id} hostId={authUser.id} />
                                    </div>

                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* --- TAB 3: COMPLETED REPORTS --- */}
                {currentTab === "reports" && (
                    completedSessions.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center">
                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                <Trophy className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800">No completed reports</h3>
                            <p className="text-slate-500 mt-2 mb-6 max-w-md">
                                When an active assignment ends, the final report with grades and leaderboards will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {completedSessions.map((session) => (
                                <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">

                                    <div className="flex items-center gap-5">
                                        <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-lg text-center shrink-0">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{session.quiz.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" /> {session._count.participants} Played
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    Ended {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                        <Link
                                            href={`/dashboard/reports/${session.id}`}
                                            className="flex-1 sm:flex-none text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                        >
                                            View Final Grades
                                        </Link>

                                        {/* NEW: Delete Button */}
                                        <DeleteSessionButton
                                            sessionId={session.id}
                                            hostId={authUser.id}
                                        />
                                    </div>

                                </div>
                            ))}
                        </div>
                    )
                )}

            </main>
        </div>
    );
}