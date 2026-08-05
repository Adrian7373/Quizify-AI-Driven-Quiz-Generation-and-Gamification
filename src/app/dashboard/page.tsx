import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import Link from "next/link";
import { BrainCircuit, Calendar, FileQuestion, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
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

    // 3. Fetch Quizzes with Aggregated Stats
    const quizzes = await prisma.quiz.findMany({
        where: {
            creatorId: authUser.id,
        },
        orderBy: {
            createdAt: 'desc', // Newest first
        },
        select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            createdAt: true,
            _count: {
                select: {
                    questions: true,
                    sessions: true, // Counts how many times this quiz has been hosted/assigned
                }
            }
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar user={appUser} />

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

                {quizzes.length === 0 ? (
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
                )}
            </main>
        </div>
    );
}