"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAnswer, getParticipantProgress } from "../actions";
import { cleanupPracticeSession } from "@/app/actions";
import { Loader2, Flame, Trophy, LogOut } from "lucide-react";
import toast from "react-hot-toast";

interface AsyncPlayerProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
}

export default function AsyncPlayer({ sessionId, quizTitle, questions }: AsyncPlayerProps) {
    const router = useRouter();

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Question Interaction State
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [textAnswer, setTextAnswer] = useState<string>("");// State for typed answers
    const [isRevealed, setIsRevealed] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

    useEffect(() => {
        async function initPlayer() {
            const storedId = localStorage.getItem(`participant_${sessionId}`);
            if (!storedId) {
                toast.error("You need to join the game first!");
                router.push("/join");
                return;
            }

            setParticipantId(storedId);

            const progress = await getParticipantProgress(storedId);

            if (progress.error) {
                toast.error(progress.error);
                router.push("/join");
                return;
            }

            setScore(progress.score || 0);
            setStreak(progress.streak || 0);

            if (progress.answeredQuestionIds && progress.answeredQuestionIds.length > 0) {
                const nextUnansweredIndex = progress.answeredQuestionIds.length;

                if (nextUnansweredIndex >= questions.length) {
                    setIsFinished(true);
                } else {
                    setCurrentIndex(nextUnansweredIndex);
                }
            }

            setIsLoadingProgress(false);
        }

        initPlayer();
    }, [sessionId, router, questions.length]);

    useEffect(() => {
        const storedId = localStorage.getItem(`participant_${sessionId}`);
        if (!storedId) {
            toast.error("You need to join the game first!");
            router.push("/join");
        } else {
            setParticipantId(storedId);
        }
    }, [sessionId, router]);

    const currentQuestion = questions[currentIndex];

    // 2. Handle the answer submission (Updated to handle text evaluations)
    const handleAnswerSubmit = async (answer: string) => {
        if (isRevealed || !participantId) return;

        const timeTakenMs = Date.now() - questionStartTime;

        //  Smart grading based on question type
        let isCorrect = false;
        if (currentQuestion.questionType === "IDENTIFICATION") {
            // Case-insensitive exact match for identification
            isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
        } else if (currentQuestion.questionType === "ESSAY") {
            // Essays are generally graded manually or via AI later. 
            // We pass it to the DB, but can default to true/false for immediate points based on your preference.
            // Using a simple exact match fallback for now.
            isCorrect = answer.trim().toLowerCase() === (currentQuestion.correctAnswer || "").trim().toLowerCase();
        } else {
            // Multiple Choice / True False
            isCorrect = answer === currentQuestion.correctAnswer;
        }

        setSelectedAnswer(answer);
        setIsRevealed(true);

        const response = await submitAnswer(
            participantId,
            currentIndex.toString(),
            answer,
            isCorrect,
            timeTakenMs
        );

        if (response.success) {
            setScore(prev => prev + (response.pointsEarned || 0));
            setStreak(response.currentStreak || 0);
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setTextAnswer(""); //  Clear the text field for the next question
                setIsRevealed(false);
                setQuestionStartTime(Date.now());
            } else {
                setIsFinished(true);
            }
        }, 3000);
    };

    const handleExit = async () => {
        setIsExiting(true);
        await cleanupPracticeSession(sessionId);
        localStorage.removeItem(`participant_${sessionId}`);
        router.push("/dashboard");
    };

    if (!participantId || isLoadingProgress) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#4ce0a3] animate-spin" />
                <p className="text-slate-400 font-semibold animate-pulse">Reconnecting to session...</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Assignment Complete!</h1>
                    <p className="text-slate-500 mb-8">{quizTitle}</p>

                    <div className="bg-slate-100 rounded-xl p-6 mb-8">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Final Score</p>
                        <p className="text-5xl font-black text-[#4ce0a3]">{score}</p>
                    </div>

                    <button
                        onClick={handleExit}
                        disabled={isExiting}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition disabled:opacity-70"
                    >
                        {isExiting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                        {isExiting ? "Cleaning up..." : "Exit to Dashboard"}
                    </button>
                </div>
            </div>
        );
    }

    // Determine if this is a text-based question
    const isTextBased = currentQuestion.questionType === "ESSAY" || currentQuestion.questionType === "IDENTIFICATION";

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 md:p-8">
            {/* Header: Progress and Score */}
            <div className="flex items-center justify-between text-white mb-8 shrink-0">
                <div className="bg-slate-800 px-4 py-2 rounded-full font-bold">
                    {currentIndex + 1} / {questions.length}
                </div>
                <div className="flex items-center gap-4">
                    {streak >= 3 && (
                        <div className="flex items-center gap-1 text-orange-400 font-bold animate-pulse">
                            <Flame className="w-5 h-5" /> {streak} Streak!
                        </div>
                    )}
                    <div className="bg-slate-800 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                        Score: <span className="text-[#4ce0a3]">{score}</span>
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-6 flex-1 flex flex-col justify-center items-center text-center shrink-0 min-h-[200px]">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {currentQuestion.questionText}
                </h2>
            </div>

            {/* CONDITIONAL RENDER: Text Input vs Options Grid */}
            {isTextBased ? (
                <div className="w-full flex flex-col gap-4 shrink-0">
                    {currentQuestion.questionType === "ESSAY" ? (
                        <textarea
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            disabled={isRevealed}
                            placeholder="Type your essay answer here..."
                            className="w-full p-4 rounded-xl border-2 border-slate-200 text-slate-800 focus:border-[#4ce0a3] focus:outline-none resize-none min-h-[150px] transition-colors disabled:bg-slate-100 disabled:text-slate-500 text-base md:text-lg"
                        />
                    ) : (
                        <input
                            type="text"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && textAnswer.trim() && handleAnswerSubmit(textAnswer)}
                            disabled={isRevealed}
                            placeholder="Type your answer here..."
                            className="w-full p-4 md:p-6 rounded-xl border-2 border-slate-200 text-slate-800 focus:border-[#4ce0a3] focus:outline-none text-center font-bold text-lg md:text-xl transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                        />
                    )}

                    <button
                        onClick={() => handleAnswerSubmit(textAnswer)}
                        disabled={isRevealed || !textAnswer.trim()}
                        className="w-full p-4 md:p-6 rounded-xl font-bold text-lg md:text-xl bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        Submit Answer
                    </button>
                </div>
            ) : (
                <div className={`grid gap-4 shrink-0 ${currentQuestion.options?.length > 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentQuestion.options?.map((option: string, idx: number) => {
                        let buttonStyle = "bg-white text-slate-700 hover:bg-slate-100 border-slate-200 border-b-4 active:border-b-0 active:translate-y-1";

                        if (isRevealed) {
                            if (option === currentQuestion.correctAnswer) {
                                buttonStyle = "bg-emerald-500 text-white border-emerald-600 border-b-4";
                            } else if (option === selectedAnswer) {
                                buttonStyle = "bg-rose-500 text-white border-rose-600 border-b-4";
                            } else {
                                buttonStyle = "bg-slate-200 text-slate-400 border-slate-300 border-b-4 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSubmit(option)}
                                disabled={isRevealed}
                                className={`p-6 rounded-xl font-bold text-lg md:text-xl transition-all duration-200 border-2 ${buttonStyle}`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Explanation Popup */}
            <div className={`mt-4 bg-slate-800 rounded-xl p-4 transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                {/* For text questions, seeing the exact correct answer is incredibly helpful */}
                {isTextBased && currentQuestion.correctAnswer && (
                    <p className="text-[#4ce0a3] font-bold text-sm md:text-base mb-2 border-b border-slate-700 pb-2">
                        Correct Answer: <span className="text-white font-normal">{currentQuestion.correctAnswer}</span>
                    </p>
                )}
                <p className="text-slate-300 text-sm md:text-base">
                    <span className="font-bold text-white">Explanation: </span>
                    {currentQuestion.explanation || "No specific explanation provided."}
                </p>
            </div>
        </div>
    );
}