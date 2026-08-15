"use client"

import { useState } from "react";
import Link from "next/link";
import { Calendar, FileQuestion, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import QuizCardActions from "./QuizCardAction"; // Adjust import name to match your exact file

interface QuizCardProps {
    quiz: any;
    userId: string;
}

export default function QuizCard({ quiz, userId }: QuizCardProps) {
    // Optimistic state manager
    const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);

    return (
        <div
            className={`group bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-[#4ce0a3] transition-all duration-300 flex-col overflow-hidden ${isOptimisticallyDeleted ? 'hidden' : 'flex'}`}
        >
            {/* Link covers the top info part */}
            <Link href={`/quiz/${quiz.id}`} className="p-5 sm:p-6 flex flex-col flex-1 cursor-pointer">
                <div className="flex justify-between items-start mb-4 gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-[#4ce0a3] transition-colors">
                        {quiz.title}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${quiz.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                            quiz.difficulty === 'normal' ? 'bg-blue-100 text-blue-700' :
                                'bg-rose-100 text-rose-700'
                        }`}>
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                    </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                    {quiz.description}
                </p>

                <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-400 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <FileQuestion className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {quiz._count.questions} Qs
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {quiz._count.sessions} Plays
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto shrink-0 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden xsm:block" />
                        {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                    </div>
                </div>
            </Link>

            {/* Action Footer */}
            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
                <QuizCardActions
                    quizId={quiz.id}
                    userId={userId}
                    quizTitle={quiz.title}
                    onDeleteOptimistic={() => setIsOptimisticallyDeleted(true)}
                    onDeleteRevert={() => setIsOptimisticallyDeleted(false)}
                />
            </div>
        </div>
    );
}