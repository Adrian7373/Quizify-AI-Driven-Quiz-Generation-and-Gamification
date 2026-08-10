"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Trophy, Clock, CheckCircle2, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { submitAnswer, getParticipantProgress } from "../actions";
import { submitAndGradeShortAnswer } from "@/app/actions";

interface LivePlayerProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
    initialIndex: number;
    initialStatus: string;
}

export default function LivePlayer({ sessionId, quizTitle, initialStatus, questions, initialIndex }: LivePlayerProps) {
    const router = useRouter();
    const supabase = createClient();

    // ==========================================
    // 1. ALL STATE HOOKS (Must be at the very top)
    // ==========================================
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // AI grading state
    const [isGrading, setIsGrading] = useState(false);
    const [aiResult, setAiResult] = useState<{ feedback: string, score: number } | null>(null);

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    // Synced Game State
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFinished, setIsFinished] = useState(false);
    const [isWaiting, setIsWaiting] = useState(initialStatus === "WAITING");

    // Player Stats
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0); // Added missing streak state

    // Local Question State
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Added missing isCorrect state

    // ==========================================
    // 2. ALL USE-EFFECT HOOKS
    // ==========================================

    // 1. Authenticate & Rehydrate
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

            if (progress.success) {
                setScore(progress.score || 0);
                // Check if they already answered the CURRENT question (handles disconnects)
                if (progress.answeredQuestionIds?.includes(initialIndex.toString())) {
                    setHasAnswered(true);
                }
            }
            setIsLoadingProgress(false);
        }
        initPlayer();
    }, [sessionId, router, initialIndex]);

    const currentQuestion = questions[currentIndex];

    // 2. Reset timer when the teacher advances the question
    useEffect(() => {
        if (currentQuestion?.timeLimitSeconds) {
            setTimeLeft(currentQuestion.timeLimitSeconds);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex, currentQuestion]);

    // 3. Local countdown loop
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || hasAnswered || isWaiting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, hasAnswered, isWaiting]);

    // 4. Supabase Realtime: Listen for Teacher's Commands
    useEffect(() => {
        const channel = supabase
            .channel('live-game-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'GameSession',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {

                    if (payload.eventType === 'DELETE') {
                        toast.error("The host has cancelled the game.");
                        window.location.href = "/join";
                        return;
                    }

                    if (payload.eventType === 'UPDATE') {
                        const session = payload.new;

                        // Handle Status Changes
                        if (session.status === 'FINISHED') {
                            setIsFinished(true);
                        } else if (session.status === 'IN_PROGRESS') {
                            setIsWaiting(false); // The host clicked Start Game!
                        }

                        // Handle Question Index Changes
                        if (session.currentQuestionIndex > currentIndex) {
                            setCurrentIndex(session.currentQuestionIndex);
                            // Reset local states for the new question!
                            setHasAnswered(false);
                            setSelectedAnswer(null);
                            setIsCorrect(null);
                            setIsGrading(false);
                            setAiResult(null);
                            setQuestionStartTime(Date.now());
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, currentIndex, supabase]);

    // ==========================================
    // 3. HANDLERS
    // ==========================================

    const handleShortAnswerSubmit = async () => {
        if (!selectedAnswer || selectedAnswer.trim() === '') return;

        setHasAnswered(true);
        setIsGrading(true);

        const timeTakenMs = Date.now() - questionStartTime;

        const response = await submitAndGradeShortAnswer(
            participantId!,
            currentQuestion.id,
            selectedAnswer,
            "English",
            timeTakenMs,
        );

        setIsGrading(false);

        if (response.success) {
            setIsCorrect(response.isCorrect);
            setAiResult({ feedback: response.feedback, score: response.score });

            if (response.isCorrect) {
                setStreak(prev => prev + 1);
                setScore(prev => prev + response.score * 100);
            } else {
                setStreak(0);
            }
        } else {
            toast.error("Failed to grade response.");
            setHasAnswered(false);
        }
    };

    const handleAnswerClick = async (answer: string) => {
        if (hasAnswered || !participantId || timeLeft === 0) return;

        const timeTakenMs = Date.now() - questionStartTime;
        const isAnswerCorrect = answer === currentQuestion.correctAnswer;

        setHasAnswered(true);
        setSelectedAnswer(answer);
        setIsCorrect(isAnswerCorrect);

        const response = await submitAnswer(
            participantId,
            currentIndex.toString(),
            answer,
            isAnswerCorrect,
            timeTakenMs
        );

        if (response.success) {
            setScore(prev => prev + (response.pointsEarned || 0));
        }
    };

    // ==========================================
    // 4. RENDER (Early Returns & UI)
    // ==========================================

    if (!participantId || isLoadingProgress) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-900">
                <Loader2 className="w-10 h-10 text-[#4ce0a3] animate-spin" />
                <p className="text-slate-400 font-semibold animate-pulse">Syncing with host...</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 bg-slate-900 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Game Over!</h1>
                    <p className="text-slate-500 mb-8">Look at the projector to see the podium.</p>

                    <div className="bg-slate-100 rounded-xl p-6 mb-8">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Your Score</p>
                        <p className="text-5xl font-black text-[#4ce0a3]">{score}</p>
                    </div>

                    <button onClick={() => router.push('/')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (isWaiting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 bg-slate-900 animate-in fade-in duration-500">
                <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center max-w-md w-full shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">You're in!</h2>
                    <p className="text-slate-400 text-lg">Look at the projector.<br />The host will start the game soon.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between text-white mb-8 shrink-0">
                <div className="bg-slate-800 px-4 py-2 rounded-full font-bold">
                    Q {currentIndex + 1}
                </div>

                {timeLeft !== null && !hasAnswered && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border ${timeLeft <= 5
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-transparent'
                        }`}>
                        <Timer className="w-5 h-5" />
                        <span className="text-xl">{timeLeft}s</span>
                    </div>
                )}

                <div className="bg-slate-800 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    Score: <span className="text-[#4ce0a3]">{score}</span>
                </div>
            </div>

            {/* Stage Area */}
            {hasAnswered && !isGrading && !aiResult ? (
                // NORMAL MC/TF WAITING SCREEN
                <div className="flex-1 flex flex-col justify-center items-center bg-slate-800/50 rounded-2xl border-2 border-slate-700 p-8 animate-in fade-in">
                    <CheckCircle2 className="w-20 h-20 text-[#4ce0a3] mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Answer Submitted!</h2>
                    <p className="text-slate-400 flex items-center gap-2">
                        <Clock className="w-5 h-5 animate-pulse" /> Waiting for host...
                    </p>
                </div>
            ) : timeLeft === 0 ? (
                // TIME'S UP SCREEN
                <div className="flex-1 flex flex-col justify-center items-center bg-rose-500/10 rounded-2xl border-2 border-rose-500/30 p-8 animate-in fade-in">
                    <Timer className="w-20 h-20 text-rose-400 mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Time's Up!</h2>
                    <p className="text-slate-400">Waiting for host to continue...</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-6 flex-1 flex flex-col justify-center items-center text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                            {currentQuestion.questionText}
                        </h2>
                    </div>

                    {/* Check if it's a Short Answer question */}
                    {currentQuestion.type === 'Short Answer' ? (
                        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-6">

                            <textarea
                                value={selectedAnswer || ''}
                                onChange={(e) => !hasAnswered && setSelectedAnswer(e.target.value)}
                                disabled={hasAnswered}
                                placeholder="Type your essay or short answer here..."
                                className="w-full min-h-[160px] p-5 rounded-2xl border-2 border-slate-200 focus:border-[#4ce0a3] bg-white text-slate-700 disabled:opacity-70 disabled:bg-slate-50 resize-y outline-none font-medium text-lg transition-colors"
                            />

                            {!hasAnswered && (
                                <button
                                    onClick={handleShortAnswerSubmit}
                                    className="bg-slate-900 text-white font-black py-4 px-8 rounded-xl hover:bg-slate-800 transition-transform hover:scale-105 self-end w-full sm:w-auto"
                                >
                                    Submit Answer
                                </button>
                            )}

                            {isGrading && (
                                <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-xl flex items-center justify-center gap-4 animate-pulse">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <span className="text-indigo-800 font-bold text-lg">AI is evaluating your response...</span>
                                </div>
                            )}

                            {hasAnswered && !isGrading && aiResult && (
                                <div className={`mt-2 p-6 md:p-8 rounded-2xl border-2 animate-in slide-in-from-bottom-4 duration-500 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className={`font-black text-2xl ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {isCorrect ? 'Great Concept Mastery!' : 'Room for Improvement'}
                                            </h3>
                                        </div>

                                        <div className="bg-white px-5 py-3 rounded-xl font-black shadow-sm text-slate-700 border border-slate-200 text-xl flex items-baseline gap-1 shrink-0">
                                            {aiResult.score} <span className="text-slate-400 text-sm font-bold">/ 10</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 p-5 rounded-xl border border-white">
                                        <span className="font-bold text-xs uppercase tracking-widest block mb-2 opacity-60">Teacher's Insight</span>
                                        <p className="text-slate-700 leading-relaxed font-medium">
                                            {aiResult.feedback}
                                        </p>
                                    </div>

                                    <p className="text-slate-500 flex items-center gap-2 mt-6 justify-center">
                                        <Clock className="w-5 h-5 animate-pulse" /> Waiting for host to advance...
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`grid gap-4 shrink-0 ${currentQuestion.options?.length > 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            {currentQuestion.options?.map((option: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerClick(option)}
                                    disabled={hasAnswered}
                                    className="p-6 rounded-xl font-bold text-lg md:text-xl transition-all duration-200 border-2 bg-white text-slate-700 hover:bg-slate-100 border-slate-200 border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}