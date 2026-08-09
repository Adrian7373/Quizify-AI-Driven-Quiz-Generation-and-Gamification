"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuizFromBank } from "@/app/actions";
import { Search, CheckSquare, Square, Layers, X, Loader2, ArrowLeft } from "lucide-react"; // 1. Added ArrowLeft
import Link from "next/link"; // 2. Added Link
import toast from "react-hot-toast";

interface QuestionBankClientProps {
    questions: any[];
    userId: string;
}

export default function QuestionBankClient({ questions, userId }: QuestionBankClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");

    // 1. Filter Logic
    const filteredQuestions = questions.filter(q =>
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Selection Logic
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredQuestions.length) {
            setSelectedIds(new Set()); // Deselect all
        } else {
            setSelectedIds(new Set(filteredQuestions.map(q => q.id))); // Select all
        }
    };

    // 3. Submit Logic
    const handleCompileQuiz = async () => {
        if (!newTitle) return toast.error("Please enter a title for the new quiz.");

        setIsSubmitting(true);
        const response = await createQuizFromBank(
            userId,
            newTitle,
            newDesc,
            Array.from(selectedIds)
        );

        if (response.error) {
            toast.error(response.error);
            setIsSubmitting(false);
        } else {
            toast.success("Quiz compiled successfully!");
            router.push('/dashboard'); // Go back to dashboard to see the new quiz
        }
    };

    return (
        <div className="relative">
            {/* Header & Search */}
            <div className="mb-8">
                {/* 3. Added Back Button */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4ce0a3] transition-colors font-semibold text-sm mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Question Bank</h1>
                        <p className="text-slate-500 mt-1">Mix and match your past questions to create a new quiz.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search questions or quiz titles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4ce0a3] focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* List Controls */}
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-bold text-slate-500">
                    Showing {filteredQuestions.length} questions
                </span>
                <button
                    onClick={selectAll}
                    className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                    {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? "Deselect All" : "Select All Visible"}
                </button>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q) => {
                    const isSelected = selectedIds.has(q.id);
                    return (
                        <div
                            key={q.id}
                            onClick={() => toggleSelection(q.id)}
                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex gap-4 ${isSelected
                                    ? 'border-[#4ce0a3] bg-[#4ce0a3]/5 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                        >
                            <div className="shrink-0 mt-1">
                                {isSelected ? (
                                    <CheckSquare className="w-6 h-6 text-[#4ce0a3]" />
                                ) : (
                                    <Square className="w-6 h-6 text-slate-300" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
                                    From: {q.quiz.title}
                                </span>
                                <h3 className="text-slate-800 font-bold text-lg leading-snug mb-3">
                                    {q.questionText}
                                </h3>

                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-semibold text-emerald-600">Answer: </span>
                                    {q.correctAnswer}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredQuestions.length === 0 && (
                <div className="text-center p-12 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-medium">No questions found matching your search.</p>
                </div>
            )}

            {/* FLOATING ACTION BAR (Pops up when items are selected) */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-10 z-40 border border-slate-700">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="bg-[#4ce0a3]/20 p-2 rounded-lg">
                            <Layers className="w-5 h-5 text-[#4ce0a3]" />
                        </div>
                        <div className="text-white">
                            <span className="font-black text-lg">{selectedIds.size}</span>
                            <span className="text-slate-400 font-medium ml-1">Questions Selected</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-colors"
                    >
                        Compile New Quiz
                    </button>
                </div>
            )}

            {/* COMPILE MODAL */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800">Name Your Quiz</h2>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Title</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Midterm Review"
                                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-[#4ce0a3] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Description (Optional)</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Combined from past lessons..."
                                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-[#4ce0a3] focus:outline-none resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCompileQuiz}
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Generate Quiz"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}