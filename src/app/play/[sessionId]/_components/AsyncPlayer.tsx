"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAnswer } from "../actions";
import { Loader2, Flame, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { getParticipantProgress } from "../actions";

interface AsyncPlayerProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
}

export default function AsyncPlayer({ sessionId, quizTitle, questions }: AsyncPlayerProps) {
    const router = useRouter();
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Question Interaction State
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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

            // Fetch their progress from the database
            const progress = await getParticipantProgress(storedId);

            if (progress.error) {
                toast.error(progress.error);
                router.push("/join");
                return;
            }

            // Sync the local score and streak
            setScore(progress.score || 0);
            setStreak(progress.streak || 0);

            // Fast-forward to the first unanswered question
            if (progress.answeredQuestionIds && progress.answeredQuestionIds.length > 0) {
                // Because you used array index as questionId in submitAnswer ("0", "1", etc)
                // The length of answered questions is perfectly equivalent to the next index!
                const nextUnansweredIndex = progress.answeredQuestionIds.length;

                if (nextUnansweredIndex >= questions.length) {
                    setIsFinished(true); // They already finished the quiz!
                } else {
                    setCurrentIndex(nextUnansweredIndex);
                }
            }

            setIsLoadingProgress(false);
        }

        initPlayer();
    }, [sessionId, router, questions.length]);

    // 1. Authenticate the device
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

    // 2. Handle the answer submission
    const handleAnswerClick = async (answer: string) => {
        if (isRevealed || !participantId) return; // Prevent double-clicking

        const timeTakenMs = Date.now() - questionStartTime;
        const isCorrect = answer === currentQuestion.correctAnswer;

        // Show immediate visual feedback
        setSelectedAnswer(answer);
        setIsRevealed(true);

        // Fire background server action
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

        // Wait 2.5 seconds so they can read the explanation, then advance
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsRevealed(false);
                setQuestionStartTime(Date.now());
            } else {
                setIsFinished(true);
            }
        }, 3000);
    };

    if (!participantId || isLoadingProgress) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#4ce0a3] animate-spin" />
                <p className="text-slate-400 font-semibold animate-pulse">Reconnecting to session...</p>
            </div>
        );
    }

    // --- VIEW 1: RESULTS SCREEN ---
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
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW 2: GAME PLAYER ---
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
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-6 flex-1 flex flex-col justify-center items-center text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {currentQuestion.questionText}
                </h2>
            </div>

            {/* Answers Grid (Supports Multiple Choice or True/False) */}
            <div className={`grid gap-4 shrink-0 ${currentQuestion.options?.length > 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {currentQuestion.options?.map((option: string, idx: number) => {

                    // Determine button styling based on reveal state
                    let buttonStyle = "bg-white text-slate-700 hover:bg-slate-100 border-slate-200 border-b-4 active:border-b-0 active:translate-y-1";

                    if (isRevealed) {
                        if (option === currentQuestion.correctAnswer) {
                            buttonStyle = "bg-emerald-500 text-white border-emerald-600 border-b-4"; // Correct answer lights up green
                        } else if (option === selectedAnswer) {
                            buttonStyle = "bg-rose-500 text-white border-rose-600 border-b-4"; // Wrong choice lights up red
                        } else {
                            buttonStyle = "bg-slate-200 text-slate-400 border-slate-300 border-b-4 opacity-50"; // Others fade out
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswerClick(option)}
                            disabled={isRevealed}
                            className={`p-6 rounded-xl font-bold text-lg md:text-xl transition-all duration-200 border-2 ${buttonStyle}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {/* Explanation Popup */}
            <div className={`mt-4 bg-slate-800 rounded-xl p-4 transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <p className="text-slate-300 text-sm md:text-base">
                    <span className="font-bold text-white">Explanation: </span>
                    {currentQuestion.explanation}
                </p>
            </div>
        </div>
    );
}