"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Trophy, Clock, CheckCircle2, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { submitAnswer, getParticipantProgress } from "../actions";

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
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    // Synced Game State
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFinished, setIsFinished] = useState(false);
    const [isWaiting, setIsWaiting] = useState(initialStatus === "WAITING");

    // Player Stats
    const [score, setScore] = useState(0);

    // Local Question State
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

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

    // 1. Reset timer when the teacher advances the question
    useEffect(() => {
        if (currentQuestion?.timeLimitSeconds) {
            setTimeLeft(currentQuestion.timeLimitSeconds);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex, currentQuestion]);

    // 2. Local countdown loop
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || hasAnswered || isWaiting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, hasAnswered, isWaiting]);

    // 2. Supabase Realtime: Listen for Teacher's Commands
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
                        window.location.href = "/join"; // Send them back to the home/join page
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
                            setHasAnswered(false);
                            setSelectedAnswer(null);
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

    const handleAnswerClick = async (answer: string) => {
        if (hasAnswered || !participantId || timeLeft === 0) return;

        const timeTakenMs = Date.now() - questionStartTime;
        const currentQuestion = questions[currentIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;

        setHasAnswered(true);
        setSelectedAnswer(answer);

        const response = await submitAnswer(
            participantId,
            currentIndex.toString(),
            answer,
            isCorrect,
            timeTakenMs
        );

        if (response.success) {
            setScore(prev => prev + (response.pointsEarned || 0));
        }
    };

    if (!participantId || isLoadingProgress) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#4ce0a3] animate-spin" />
                <p className="text-slate-400 font-semibold animate-pulse">Syncing with host...</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 animate-in fade-in zoom-in duration-500">
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
            {hasAnswered ? (
                <div className="flex-1 flex flex-col justify-center items-center bg-slate-800/50 rounded-2xl border-2 border-slate-700 p-8 animate-in fade-in">
                    <CheckCircle2 className="w-20 h-20 text-[#4ce0a3] mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Answer Submitted!</h2>
                    <p className="text-slate-400 flex items-center gap-2">
                        <Clock className="w-5 h-5 animate-pulse" /> Waiting for host...
                    </p>
                </div>
            ) : timeLeft === 0 ? (
                // NEW: Time's Up View (Shown if time runs out before the host officially advances)
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

                    <div className={`grid gap-4 shrink-0 ${currentQuestion.options?.length > 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {currentQuestion.options?.map((option: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerClick(option)}
                                className="p-6 rounded-xl font-bold text-lg md:text-xl transition-all duration-200 border-2 bg-white text-slate-700 hover:bg-slate-100 border-slate-200 border-b-4 active:border-b-0 active:translate-y-1"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}