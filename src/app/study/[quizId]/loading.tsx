"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export default function FlashcardLoading() {

    // Prevent the scroll-position bug when navigating to this page
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-inter">
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-12">
                <div className="flex flex-col h-full animate-pulse w-full">
                    {/* Header & Progress Skeleton */}
                    <header className="mb-6 sm:mb-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm sm:text-base">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                <div className="h-5 sm:h-6 w-12 bg-slate-700 rounded-md"></div>
                            </div>
                            {/* Mastered Badge Placeholder */}
                            <div className="bg-slate-800 w-32 sm:w-36 h-6 sm:h-8 rounded-full"></div>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden"></div>
                    </header>

                    {/* 3D Flashcard Container Skeleton */}
                    <div className="flex-1 flex flex-col items-center justify-center relative perspective-[1500px]">

                        {/* Keyboard hint skeleton */}
                        <div className="absolute top-0 w-64 h-5 bg-slate-800 rounded hidden md:block"></div>

                        <div className="relative w-full h-[60vh] min-h-[400px] sm:h-auto sm:aspect-[4/3] max-w-2xl bg-white rounded-3xl shadow-2xl p-5 sm:p-12 flex flex-col justify-center items-center border-4 border-slate-100">

                            {/* Top Left Label (Question) */}
                            <div className="absolute top-5 left-5 sm:top-6 sm:left-6 w-20 h-4 sm:h-5 bg-slate-200 rounded"></div>

                            {/* Center Question Text Placeholder */}
                            <div className="w-full flex flex-col items-center justify-center gap-3 sm:gap-4 mt-8 mb-8">
                                <div className="h-8 sm:h-10 lg:h-12 w-4/5 bg-slate-200 rounded-xl"></div>
                                <div className="h-8 sm:h-10 lg:h-12 w-3/5 bg-slate-200 rounded-xl"></div>
                                <div className="h-8 sm:h-10 lg:h-12 w-2/5 bg-slate-200 rounded-xl"></div>
                            </div>

                            {/* Bottom Hint (Tap to flip) */}
                            <div className="absolute bottom-5 sm:bottom-6 w-20 h-3 sm:h-4 bg-slate-200 rounded"></div>
                        </div>

                        {/* Controls Skeleton (Hidden intentionally to match initial component state) */}
                        <div className="mt-6 sm:mt-12 h-16 sm:h-20 w-full max-w-md opacity-0 pointer-events-none"></div>
                    </div>
                </div>
            </main>
        </div>
    );
}