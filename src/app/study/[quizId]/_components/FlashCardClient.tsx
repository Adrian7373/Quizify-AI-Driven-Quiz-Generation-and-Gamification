"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";

interface FlashcardClientProps {
    quiz: { title: string; description: string };
    questions: any[];
}

export default function FlashcardClient({ quiz, questions }: FlashcardClientProps) {
    const router = useRouter();

    // The Active Queue: Starts with all questions.
    const [queue, setQueue] = useState([...questions]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredCount, setMasteredCount] = useState(0);

    const totalQuestions = questions.length;
    const isFinished = queue.length === 0;
    const currentQuestion = queue[0];

    // --- Actions ---

    const handleFlip = () => setIsFlipped(prev => !prev);

    const handleGotIt = useCallback(() => {
        setIsFlipped(false);
        setTimeout(() => {
            setQueue(prev => prev.slice(1)); // Remove from queue
            setMasteredCount(prev => prev + 1);
        }, 150); // Slight delay allows the card to un-flip before changing text
    }, []);

    const handleReviewLater = useCallback(() => {
        setIsFlipped(false);
        setTimeout(() => {
            // Take the current question and move it to the very back of the array
            setQueue(prev => {
                const newQueue = [...prev];
                const movedItem = newQueue.shift();
                if (movedItem) newQueue.push(movedItem);
                return newQueue;
            });
        }, 150);
    }, []);

    const handleRestart = () => {
        setQueue([...questions]);
        setMasteredCount(0);
        setIsFlipped(false);
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        if (isFinished) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                handleFlip();
            } else if (e.code === "ArrowRight") {
                handleGotIt();
            } else if (e.code === "ArrowLeft") {
                handleReviewLater();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFinished, handleGotIt, handleReviewLater]);


    // --- Finished State ---
    if (isFinished) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center max-w-md w-full shadow-2xl">
                    <div className="bg-[#4ce0a3]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BrainCircuit className="w-10 h-10 text-[#4ce0a3]" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Deck Mastered!</h2>
                    <p className="text-slate-400 mb-8">You successfully reviewed all {totalQuestions} questions in <b>{quiz.title}</b>.</p>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleRestart} className="w-full py-4 bg-[#4ce0a3] text-slate-900 font-bold rounded-xl hover:bg-[#3bc48b] transition-colors flex justify-center items-center gap-2">
                            <RotateCcw className="w-5 h-5" /> Study Again
                        </button>
                        <button onClick={() => router.back()} className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Active Study State ---
    const progressPercentage = (masteredCount / totalQuestions) * 100;

    return (
        <div className="flex flex-col h-full">
            {/* Header & Progress */}
            <header className="mb-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold">
                        <ArrowLeft className="w-5 h-5" /> Leave
                    </button>
                    <span className="text-slate-400 font-bold text-sm bg-slate-800 px-4 py-1.5 rounded-full">
                        {masteredCount} / {totalQuestions} Mastered
                    </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-[#4ce0a3] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(76,224,163,0.5)]"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </header>

            {/* The 3D Flashcard Container */}
            <div className="flex-1 flex flex-col items-center justify-center relative perspective-[1500px]">

                {/* Keyboard hints for desktop */}
                <div className="absolute top-0 w-full text-center text-slate-500 font-medium text-sm hidden md:block">
                    Tip: Use <kbd className="bg-slate-800 px-2 py-1 rounded text-slate-300 mx-1">Space</kbd> to flip, and <kbd className="bg-slate-800 px-2 py-1 rounded text-slate-300 mx-1">Arrows</kbd> to sort.
                </div>

                <div
                    onClick={handleFlip}
                    className="relative w-full max-w-2xl aspect-[4/3] cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] [transform-style:preserve-3d]"
                    style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* Front of Card (Question) */}
                    <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col justify-center items-center text-center [backface-visibility:hidden] border-4 border-slate-100">
                        <span className="absolute top-6 left-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Question</span>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 leading-snug">
                            {currentQuestion.questionText}
                        </h3>
                        <p className="absolute bottom-6 text-slate-400 font-bold animate-pulse text-sm">Tap to flip</p>
                    </div>

                    {/* Back of Card (Answer & Explanation) */}
                    <div className="absolute inset-0 w-full h-full bg-slate-800 rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col justify-center items-center text-center [backface-visibility:hidden] border-4 border-slate-700 [transform:rotateY(180deg)]">
                        <span className="absolute top-6 left-6 text-sm font-bold text-[#4ce0a3] uppercase tracking-widest">Answer</span>

                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug mb-4">
                            {currentQuestion.correctAnswer}
                        </h3>

                        {currentQuestion.explanation && (
                            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 w-full max-w-lg">
                                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls (Only visible when flipped) */}
                <div className={`mt-8 sm:mt-12 flex items-center justify-center gap-4 transition-all duration-300 w-full max-w-md ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleReviewLater(); }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-amber-500 rounded-2xl transition-all group"
                    >
                        <X className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        <span className="text-white font-bold">Review Later</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleGotIt(); }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-[#4ce0a3]/10 hover:bg-[#4ce0a3]/20 border-2 border-[#4ce0a3]/50 hover:border-[#4ce0a3] rounded-2xl transition-all group"
                    >
                        <Check className="w-8 h-8 text-[#4ce0a3] group-hover:scale-110 transition-transform" />
                        <span className="text-[#4ce0a3] font-bold">Got It</span>
                    </button>
                </div>

            </div>
        </div>
    );
}