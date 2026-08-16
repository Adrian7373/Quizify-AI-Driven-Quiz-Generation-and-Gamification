"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Play, Trash, CircleX, Users, Loader2, Copy, Check, BrainCircuit, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { deleteQuiz, startPracticeQuiz } from "@/app/actions";
import { createAsyncSession, createLiveSession } from "@/app/actions/generate";
import Link from "next/link";

interface QuizCardActionsProps {
    quizId: string;
    userId: string;
    quizTitle: string;
    userRole: "TEACHER" | "STUDENT";
    onDeleteOptimistic: () => void;
    onDeleteRevert: () => void;
}

export default function QuizCardActions({ quizId, userId, quizTitle, onDeleteOptimistic, onDeleteRevert, userRole }: QuizCardActionsProps) {
    const router = useRouter();

    //Practice State
    const [isStartingPractice, setIsStartingPractice] = useState(false);

    // Modal States
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLaunchingLive, setIsLaunchingLive] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form States
    const [dueDate, setDueDate] = useState("");
    const [generatedPin, setGeneratedPin] = useState("");
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [maxFactions, setMaxFactions] = useState(4);
    const [isCreatingLive, setIsCreatingLive] = useState(false);
    const [gameMode, setGameMode] = useState<"SOLO" | "FACTIONS">("SOLO");

    // Handlers
    const handleCreateAssignment = async () => {
        if (!dueDate) return toast.error("Please select a due date.");
        setIsCreatingSession(true);
        const response = await createAsyncSession(quizId, userId, new Date(dueDate));

        if (response.error) {
            toast.error(response.error);
        } else {
            setGeneratedPin(response.session!.joinCode);
            toast.success("Assignment created!");
        }
        setIsCreatingSession(false);
    };

    const handleCopyLink = async () => {
        const joinLink = `${window.location.origin}/join?pin=${generatedPin}`;
        await navigator.clipboard.writeText(joinLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleConfirmLiveLaunch = async () => {
        setIsCreatingLive(true);
        const finalMaxFactions = gameMode === "SOLO" ? 0 : maxFactions;
        const response = await createLiveSession(quizId, userId, finalMaxFactions);

        if (response.error) {
            toast.error(response.error);
            setIsCreatingLive(false);
        } else {
            router.push(`/host/${response.session!.id}`);
        }
    };

    const handleDelete = async () => {
        // A. Instantly close the modal and hide the card visually
        setIsDeleting(false);
        onDeleteOptimistic();

        // B. Perform the server action in the background
        const response = await deleteQuiz(quizId, userId);

        if (response?.error) {
            // C. If it fails, bring the card back and show an error
            onDeleteRevert();
            toast.error("Failed to delete quiz.");
        } else {
            // D. On success, silently refresh the server data so the next page load is accurate
            toast.success("Quiz deleted successfully!");
            router.refresh();
        }
    };

    const handlePracticeLaunch = async () => {
        setIsStartingPractice(true);

        // 1. Satisfy TS by guaranteeing quizId and userId are valid strings before calling
        if (!quizId || !userId) {
            toast.error("Missing quiz or user information.");
            setIsStartingPractice(false);
            return;
        }

        const response = await startPracticeQuiz(quizId, userId, "Practice Mode");

        // 2. Check for the error AND guarantee the response variables exist
        if (response.error || !response.sessionId || !response.participantId) {
            toast.error(response.error || "Failed to start practice.");
            setIsStartingPractice(false);
        } else {
            // 3. TS now knows for a fact that response.participantId is a string
            localStorage.setItem(`participant_${response.sessionId}`, response.participantId);
            router.push(`/play/${response.sessionId}`);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 w-full mt-auto">


                {userRole === "STUDENT" ? (
                    <>
                        <Link
                            href={`/study/${quizId}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs sm:text-sm font-bold transition-colors"
                        >
                            <BookOpen className="w-4 h-4" /> Flashcards
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); handlePracticeLaunch(); }}
                            disabled={isStartingPractice}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs sm:text-sm font-bold transition-colors disabled:opacity-70"
                        >
                            {isStartingPractice ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <BrainCircuit className="w-4 h-4" />
                            )}
                            Practice Quiz
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsAssigning(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs sm:text-sm font-bold transition-colors">
                            <CalendarClock className="w-4 h-4" /> Assign
                        </button>
                        <button onClick={() => setIsLaunchingLive(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs sm:text-sm font-bold transition-colors">
                            <Play className="w-4 h-4" fill="currentColor" /> Live
                        </button>
                    </>
                )}

                {/* Delete button */}
                <button
                    onClick={(e) => { e.preventDefault(); setIsDeleting(true); }}
                    className="flex items-center justify-center p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors shrink-0"
                    title="Delete Quiz"
                >
                    <Trash className="w-4 h-4" />
                </button>
            </div>



            {/* --- MODALS --- */}
            {isDeleting && (
                <div onClick={(e) => { e.preventDefault(); setIsDeleting(false); }} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4'>
                    <div onClick={(e) => e.stopPropagation()} className='bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl max-w-sm w-full shadow-2xl'>
                        <div className="bg-rose-100 p-3 rounded-full mb-2">
                            <CircleX className='w-8 h-8 text-rose-600' />
                        </div>
                        <h3 className='text-xl sm:text-2xl font-bold text-slate-800 text-center'>Delete "{quizTitle}"?</h3>
                        <p className='text-center text-slate-500 mb-4 text-sm sm:text-base'>Are you sure you want to permanently delete this quiz? This action cannot be undone.</p>
                        <div className='flex flex-col sm:flex-row gap-3 w-full'>
                            <button onClick={() => setIsDeleting(false)} className='w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors'>Cancel</button>
                            <button onClick={handleDelete} className='w-full sm:flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-lg transition-colors'>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {isAssigning && (
                <div onClick={(e) => { e.preventDefault(); !generatedPin && setIsAssigning(false); }} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4 cursor-default'>
                    <div onClick={(e) => e.stopPropagation()} className='z-[60] bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl shadow-2xl max-w-md w-full'>
                        {!generatedPin ? (
                            <>
                                <div className="bg-amber-100 p-3 rounded-full mb-2">
                                    <CalendarClock className="w-8 h-8 text-amber-600" />
                                </div>
                                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 text-center'>Assign "{quizTitle}"</h2>
                                <p className='text-slate-500 text-center text-sm mb-2'>Students can play at their own pace until the deadline.</p>
                                <div className="w-full mb-4">
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date & Time</label>
                                    <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] transition-colors text-slate-700 font-medium" />
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3 w-full mt-2'>
                                    <button onClick={() => setIsAssigning(false)} className='w-full sm:flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors'>Cancel</button>
                                    <button onClick={handleCreateAssignment} disabled={isCreatingSession} className='w-full sm:flex-1 bg-[#4ce0a3] text-slate-900 font-bold py-3 rounded-lg hover:bg-[#3bc48b] transition flex justify-center items-center'>
                                        {isCreatingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Link"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 text-center mb-2'>Assignment Ready!</h2>
                                <p className='text-slate-500 text-center text-sm mb-4'>Share this PIN or link with your students.</p>
                                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 w-full text-center mb-4">
                                    <p className="text-xs sm:text-sm font-bold text-slate-400 mb-2 tracking-widest uppercase">GAME PIN</p>
                                    <p className="text-5xl sm:text-6xl font-black text-slate-900 tracking-widest break-all">{generatedPin}</p>
                                </div>
                                <button onClick={handleCopyLink} className={`w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-colors ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                    {isCopied ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Copy className="w-5 h-5 sm:w-6 sm:h-6" />}
                                    {isCopied ? "Copied!" : "Copy Join Link"}
                                </button>
                                <button onClick={() => { setIsAssigning(false); setGeneratedPin(""); setDueDate(""); }} className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Done</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isLaunchingLive && (
                <div onClick={(e) => { e.preventDefault(); !isCreatingLive && setIsLaunchingLive(false); }} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4 cursor-default'>
                    <div onClick={(e) => e.stopPropagation()} className='z-[60] bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl shadow-2xl max-w-md w-full'>
                        <div className="bg-indigo-50 p-3 rounded-full mb-2">
                            <Users className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className='text-xl sm:text-2xl font-bold text-slate-800 text-center'>Host "{quizTitle}" Live</h2>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full mb-2">
                            <button onClick={() => setGameMode("SOLO")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${gameMode === "SOLO" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Solo Free-for-all</button>
                            <button onClick={() => setGameMode("FACTIONS")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${gameMode === "FACTIONS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Team Factions</button>
                        </div>

                        {gameMode === "FACTIONS" ? (
                            <div className="w-full animate-in slide-in-from-right-4 duration-300">
                                <p className='text-slate-500 text-center text-sm mb-4'>How many factions? The first {maxFactions} students to join will become Faction Leaders.</p>
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 mb-4 w-full">
                                    {[2, 3, 4, 5, 6].map((num) => (
                                        <button key={num} onClick={() => setMaxFactions(num)} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-black text-lg transition-all ${maxFactions === num ? "bg-slate-900 text-white shadow-md scale-110" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}>{num}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full text-center py-4 animate-in slide-in-from-left-4 duration-300">
                                <p className='text-slate-500 text-sm'>Every student for themselves! No teams will be created.</p>
                            </div>
                        )}
                        <div className='flex flex-col sm:flex-row gap-3 w-full mt-2'>
                            <button onClick={() => setIsLaunchingLive(false)} className='w-full sm:flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors'>Cancel</button>
                            <button onClick={handleConfirmLiveLaunch} disabled={isCreatingLive} className='w-full sm:flex-1 bg-indigo-500 text-white font-bold py-3 rounded-lg hover:bg-indigo-600 transition flex justify-center items-center'>
                                {isCreatingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : "Open Lobby"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}