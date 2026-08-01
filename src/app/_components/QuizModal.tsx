"use client"

import { useState } from 'react';

// Interfaces matching your Pydantic/Prisma unified schema
export interface Question {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export interface QuizData {
    title: string;
    description: string;
    questions: Question[];
}

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    quizData: QuizData | null;
}

export default function QuizModal({ isOpen, onClose, quizData }: QuizModalProps) {
    const [includeAnswers, setIncludeAnswers] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

    if (!isOpen || !quizData) return null;

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    const handleDownload = (format: 'pdf' | 'docx' | 'txt') => {
        console.log(`Downloading as ${format.toUpperCase()} (Answers included: ${includeAnswers})`);
        setShowDownloadMenu(false);
        // TODO: Implement actual generation libraries (like jspdf or docx) here
        alert(`Triggering ${format.toUpperCase()} download...`);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 font-sans overflow-hidden">
            {/* 1. TOP NAVIGATION BAR */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-slate-800 truncate">
                        {quizData.title}
                    </h2>
                    <p className="text-sm text-slate-500 truncate">{quizData.description}</p>
                </div>

                <div className="flex items-center gap-6 ml-4">
                    {/* Include Answers Toggle */}
                    <label className="flex items-center cursor-pointer gap-2 group print:hidden">
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                            With Answers
                        </span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={includeAnswers}
                                onChange={() => setIncludeAnswers(!includeAnswers)}
                            />
                            <div className={`block w-11 h-6 rounded-full transition-colors ${includeAnswers ? 'bg-[#4ce0a3]' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeAnswers ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </label>

                    <div className="w-px h-6 bg-slate-200 print:hidden"></div>

                    {/* Download Dropdown */}
                    <div className="relative print:hidden">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Download
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-10">
                                <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">PDF (.pdf)</button>
                                <button onClick={() => handleDownload('docx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Word (.docx)</button>
                                <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Text (.txt)</button>
                            </div>
                        )}
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors print:hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Print
                    </button>

                    {/* Share Button (Primary) */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-900 bg-[#4ce0a3] rounded-lg hover:bg-[#3bc48b] transition-colors print:hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        Share
                    </button>

                    {/* Close Modal (X) */}
                    <button
                        onClick={onClose}
                        className="p-2 ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors print:hidden"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA (Scrollable) */}
            <main className="flex-1 overflow-y-auto p-6 md:p-12 print:p-0 print:overflow-visible">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Print-only Header */}
                    <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-800">
                        <h1 className="text-3xl font-bold text-black">{quizData.title}</h1>
                        <p className="text-lg text-slate-700 mt-2">{quizData.description}</p>
                    </div>

                    {/* Questions List */}
                    {quizData.questions.map((q, index) => {
                        const hasOptions = q.options && q.options.length > 0;
                        const isIdentification = !hasOptions;

                        return (
                            <div key={index} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-8 break-inside-avoid">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-sm">
                                        {index + 1}
                                    </span>
                                    <span className="mt-0.5">{q.questionText}</span>
                                </h3>

                                {/* Answer Inputs (Interactive) */}
                                <div className="mt-6 ml-10">
                                    {isIdentification ? (
                                        <input
                                            type="text"
                                            placeholder="Type your answer here..."
                                            value={userAnswers[index] || ''}
                                            onChange={(e) => handleAnswerSelect(index, e.target.value)}
                                            className="w-full max-w-md p-3 border-b-2 border-slate-300 focus:border-[#4ce0a3] bg-slate-50 focus:bg-white outline-none transition-colors text-slate-700 print:border-b print:border-black print:bg-transparent"
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((option, optIdx) => {
                                                const isSelected = userAnswers[index] === option;
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleAnswerSelect(index, option)}
                                                        className={`
                              text-left p-4 rounded-lg border-2 transition-all print:border-slate-300
                              ${isSelected
                                                                ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900'
                                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                            }
                            `}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Conditional Answers Reveal (For Teachers/Reviewing) */}
                                {includeAnswers && (
                                    <div className="mt-6 ml-10 p-4 bg-amber-50 border border-amber-200 rounded-lg print:border-black print:bg-transparent">
                                        <p className="text-sm font-bold text-amber-800 print:text-black">
                                            Correct Answer: <span className="font-normal">{q.correctAnswer}</span>
                                        </p>
                                        <p className="text-sm text-amber-700 mt-1 print:text-slate-700">
                                            <span className="font-semibold">Explanation:</span> {q.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}