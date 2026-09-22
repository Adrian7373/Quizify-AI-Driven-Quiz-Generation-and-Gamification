"use client";

import { useEffect } from "react";

export default function QuizLoading() {
    // Scroll to top on mount to prevent the scroll-position bug during transitions
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Generate 3 dummy questions for the skeleton
    const dummyQuestions = Array(3).fill(null);

    return (

        <div className="flex flex-col lg:items-center">
            <div className="w-full py-6 px-5 bg-slate-900 animate-pulse">
                {/* Top Bar */}
                <div className="flex gap-2 items-center justify-between">
                    <div className="w-20 h-8 bg-slate-300 animate-pulse rounded-md"></div>
                    <div className="w-18 h-7 bg-slate-300 animate-pulse rounded-md"></div>
                </div>
            </div>

            <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans overflow-hidden animate-pulse">

                {/* HEADER SKELETON */}
                <header className="z-40 flex px-3 sm:px-4 py-3 sm:py-4 bg-slate-900 border-b border-slate-800 shadow-sm shrink-0 relative min-h-[72px]">
                    {/* Action Container */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 pr-12 sm:pr-0">
                        {/* Answers Toggle */}
                        <div className="flex items-center gap-2 mr-1 sm:mr-0">
                            <div className="h-5 w-16 bg-slate-700 rounded-md"></div>
                            <div className="w-11 h-6 rounded-full bg-slate-700"></div>
                        </div>

                        {/* Download & Print Buttons */}
                        <div className="w-10 h-10 sm:w-28 sm:h-10 bg-slate-800 rounded-lg"></div>
                        <div className="w-10 h-10 sm:w-24 sm:h-10 bg-slate-800 rounded-lg hidden sm:block"></div>

                        {/* Desktop Divider */}
                        <div className="hidden sm:block w-px h-6 bg-slate-700 mx-1 shrink-0"></div>

                        {/* Primary Action Buttons (Edit, Assign, Live, Delete) */}
                        <div className="w-10 h-10 sm:w-24 sm:h-10 bg-slate-800 rounded-lg"></div>
                        <div className="w-10 h-10 sm:w-24 sm:h-10 bg-slate-800 rounded-lg"></div>
                        <div className="w-10 h-10 sm:w-24 sm:h-10 bg-slate-800 rounded-lg"></div>
                    </div>

                    {/* Close Button */}
                    <div className="absolute right-3 top-3 sm:static sm:ml-2 flex items-center justify-center w-10 h-10 bg-slate-800 rounded-full shrink-0"></div>
                </header>

                {/* MAIN CONTENT AREA SKELETON */}
                <main className="bg-slate-100 flex-1 overflow-y-auto p-4 sm:p-6 md:p-12">
                    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">

                        {/* Quiz Meta Data Card */}
                        <div className="flex flex-col min-w-0 items-center justify-center bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm mb-6 sm:mb-8">
                            {/* Title */}
                            <div className="h-8 sm:h-10 w-3/4 sm:w-1/2 bg-slate-200 rounded-lg mb-4"></div>
                            {/* Description */}
                            <div className="h-4 sm:h-5 w-full sm:w-3/4 bg-slate-200 rounded-md mb-2"></div>
                            <div className="h-4 sm:h-5 w-2/3 sm:w-1/2 bg-slate-200 rounded-md mb-5"></div>
                            {/* Difficulty Badge */}
                            <div className="h-6 w-20 bg-slate-200 rounded-full mt-2"></div>
                        </div>

                        {/* Questions List */}
                        {dummyQuestions.map((_, index) => (
                            <div key={index} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
                                {/* Question Header */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                                    <div className="flex gap-3 sm:gap-4 w-full">
                                        {/* Number Circle */}
                                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 mt-1 sm:mt-0"></div>
                                        {/* Question Text */}
                                        <div className="w-full space-y-3 pt-1">
                                            <div className="h-6 w-full bg-slate-200 rounded-md"></div>
                                            <div className="h-6 w-4/5 bg-slate-200 rounded-md"></div>
                                        </div>
                                    </div>
                                    {/* Timer Pill */}
                                    <div className="h-7 w-20 bg-slate-100 rounded-full shrink-0 hidden sm:block"></div>
                                </div>

                                {/* Options Grid */}
                                <div className="ml-0 sm:ml-12 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map((opt) => (
                                            <div key={opt} className="h-14 sm:h-16 w-full bg-slate-50 border-2 border-slate-100 rounded-lg"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}