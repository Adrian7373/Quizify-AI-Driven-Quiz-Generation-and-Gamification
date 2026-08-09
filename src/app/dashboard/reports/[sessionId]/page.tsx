import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Target, Flame } from "lucide-react";
import { format } from "date-fns";
import AiInsightsCard from "./_components/AiInsightsCard"; // 1. Added Import

interface ReportPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
    const { sessionId } = await params;

    // 1. Authenticate the User
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/");

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) appUser = userResponse.user;

    // 2. Fetch the Session, Quiz Info, and all Participants (Ordered by Score)
    const session = await prisma.gameSession.findUnique({
        where: {
            id: sessionId,
            hostId: authUser.id // Security check: Only the host can see this report
        },
        include: {
            quiz: {
                select: {
                    title: true,
                    _count: { select: { questions: true } }
                }
            },
            participants: {
                orderBy: { totalScore: 'desc' }, // The Leaderboard logic!
                include: {
                    responses: {
                        select: { isCorrect: true, questionId: true } // We need this to calculate accuracy
                    }
                }
            }
        }
    });

    if (!session) {
        redirect("/dashboard");
    }

    // 3. Calculate Class Statistics
    const totalParticipants = session.participants.length;

    const averageScore = totalParticipants > 0
        ? Math.round(session.participants.reduce((acc, p) => acc + p.totalScore, 0) / totalParticipants)
        : 0;

    const highestStreak = totalParticipants > 0
        ? Math.max(...session.participants.map(p => p.maxStreak))
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <NavBar user={appUser} />

            <main className="flex-1 pt-24 px-6 md:px-12 max-w-5xl mx-auto w-full pb-12">
                {/* Header Section */}
                <div className="mb-8">
                    <Link href="/dashboard?tab=assignments" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4ce0a3] transition-colors font-semibold text-sm mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{session.quiz.title}</h1>
                            <p className="text-slate-500 mt-1">
                                Session Report • Hosted on {format(new Date(session.createdAt), 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-center shrink-0">
                            <p className="text-xs font-bold text-slate-400 uppercase">Game PIN</p>
                            <p className="text-xl font-black text-slate-800 tracking-widest">{session.joinCode}</p>
                        </div>
                    </div>
                </div>

                {/* 2. ADDED AI INSIGHTS CARD */}
                <AiInsightsCard
                    sessionId={session.id}
                    initialInsight={session.classInsight}
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Total Players</p>
                            <p className="text-2xl font-black text-slate-800">{totalParticipants}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Average Score</p>
                            <p className="text-2xl font-black text-slate-800">{averageScore}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Highest Streak</p>
                            <p className="text-2xl font-black text-slate-800">{highestStreak}</p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
                        </h2>
                    </div>

                    {totalParticipants === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No students have joined this session yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                        <th className="px-6 py-4 font-semibold w-16 text-center">Rank</th>
                                        <th className="px-6 py-4 font-semibold">Nickname</th>
                                        <th className="px-6 py-4 font-semibold text-right">Points</th>
                                        <th className="px-6 py-4 font-semibold text-center text-slate-800 bg-slate-100">Score</th>
                                        <th className="px-6 py-4 font-semibold text-center">Accuracy</th>
                                        <th className="px-6 py-4 font-semibold text-center">Best Streak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.participants.map((participant, index) => {
                                        // Calculate accuracy: Correct answers / Total questions in quiz
                                        const totalQuestions = session.quiz._count.questions;
                                        const correctAnswers = participant.responses.filter(r => r.isCorrect).length;
                                        const accuracy = Math.round((correctAnswers / session.quiz._count.questions) * 100);

                                        // Styling for top 3
                                        let rankStyle = "text-slate-500 font-bold";
                                        if (index === 0) rankStyle = "text-yellow-500 font-black text-lg";
                                        else if (index === 1) rankStyle = "text-slate-400 font-black text-lg";
                                        else if (index === 2) rankStyle = "text-amber-600 font-black text-lg";

                                        return (
                                            <tr key={participant.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className={`px-6 py-4 text-center ${rankStyle}`}>
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-800">
                                                    {participant.nickname}
                                                </td>
                                                <td className="px-6 py-4 font-black text-right text-[#4ce0a3]">
                                                    {participant.totalScore}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700 bg-slate-50 border-x border-slate-100">
                                                    {correctAnswers} <span className="text-slate-400 font-medium">/ {totalQuestions}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${accuracy >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                        accuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {accuracy}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-600">
                                                    {participant.maxStreak} <Flame className="w-4 h-4 inline text-orange-400 pb-1" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}