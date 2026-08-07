"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { ChevronRight, Trophy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateQuestionIndex } from "../../actions";

interface HostPlayClientProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
    initialIndex: number;
    hostId: string;
}

export default function HostPlayClient({ sessionId, quizTitle, questions, initialIndex, hostId }: HostPlayClientProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAdvancing, setIsAdvancing] = useState(false);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleNextQuestion = async () => {
        if (isLastQuestion) return;

        setIsAdvancing(true);
        const nextIndex = currentIndex + 1;

        const response = await updateQuestionIndex(sessionId, nextIndex);

        if (response.error) {
            toast.error(response.error);
        } else {
            setCurrentIndex(nextIndex);
        }
        setIsAdvancing(false);
    };

    const handleEndGame = async () => {
        setIsAdvancing(true);
        const response = await endSessionEarly(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsAdvancing(false);
        } else {
            toast.success("Game Finished!");
            router.push(`/dashboard/reports/${sessionId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-inter">
            {/* Top Bar */}
            <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md shrink-0">
                <h1 className="text-xl font-bold text-white">{quizTitle}</h1>
                <div className="bg-slate-700 px-4 py-2 rounded-full text-slate-300 font-bold text-sm">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full">

                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8 flex-1 flex flex-col justify-center items-center text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8">
                        {currentQuestion.questionText}
                    </h2>

                    {/* Display Options for the Teacher's screen */}
                    <div className={`grid gap-4 w-full ${currentQuestion.options?.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {currentQuestion.options?.map((option: string, idx: number) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl font-bold text-lg border-2 ${option === currentQuestion.correctAnswer
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                            >
                                {option}
                                {option === currentQuestion.correctAnswer && " (Correct)"}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Control Footer */}
                <div className="flex justify-end shrink-0">
                    {!isLastQuestion ? (
                        <button
                            onClick={handleNextQuestion}
                            disabled={isAdvancing}
                            className="bg-indigo-500 hover:bg-indigo-400 text-white text-2xl font-black px-10 py-5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {isAdvancing ? <Loader2 className="w-8 h-8 animate-spin" /> : "Next Question"}
                            {!isAdvancing && <ChevronRight className="w-8 h-8" />}
                        </button>
                    ) : (
                        <button
                            onClick={handleEndGame}
                            disabled={isAdvancing}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white text-2xl font-black px-10 py-5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {isAdvancing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Trophy className="w-8 h-8" />}
                            End Game & Show Podium
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}