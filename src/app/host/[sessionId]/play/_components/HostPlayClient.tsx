"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { ChevronRight, Trophy, Loader2, Timer, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { updateQuestionIndex } from "../../actions";
import { createClient } from "@/utils/supabase/client";
import FactionRaceTrack from "./FactionRaceTrack";

interface HostPlayClientProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
    initialIndex: number;
    hostId: string;
}

export default function HostPlayClient({ sessionId, quizTitle, questions, initialIndex, hostId }: HostPlayClientProps) {
    const router = useRouter();
    const supabase = createClient();

    // Flow States
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);


    const [viewState, setViewState] = useState<"QUESTION" | "STANDINGS">("QUESTION");


    const [participants, setParticipants] = useState<any[]>([]);
    const [factions, setFactions] = useState<any[]>([]);
    const [maxFactions, setMaxFactions] = useState(0);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    // ==========================================
    // 1. DATA FETCHING & REALTIME SYNC
    // ==========================================
    useEffect(() => {
        const fetchInitialData = async () => {
            // Get session config (Solo vs Factions)
            const { data: sessionData } = await supabase.from('GameSession').select('maxFactions').eq('id', sessionId).single();
            if (sessionData) setMaxFactions(sessionData.maxFactions);

            // Get Factions
            const { data: factionData } = await supabase.from('Faction').select('*').eq('sessionId', sessionId);
            if (factionData) setFactions(factionData);

            // Get Initial Participants
            const { data: participantData } = await supabase.from('Participant').select('*').eq('sessionId', sessionId);
            if (participantData) setParticipants(participantData);
        };

        fetchInitialData();

        // Listen for scores updating as students submit answers!
        const channel = supabase.channel('host-standings')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Participant', filter: `sessionId=eq.${sessionId}` },
                (payload) => {
                    setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [sessionId, supabase]);

    // ==========================================
    // 2. TIMERS & HANDLERS
    // ==========================================
    useEffect(() => {
        if (currentQuestion?.timeLimitSeconds) {
            setTimeLeft(currentQuestion.timeLimitSeconds);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex, currentQuestion]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isAdvancing || viewState === "STANDINGS") return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(timer);
                    // Time's up! Auto-reveal the standings instead of immediately jumping to the next question
                    setViewState("STANDINGS");
                    return 0;
                }
                return prev ? prev - 1 : 0;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAdvancing, viewState]);

    const handleNextQuestion = async () => {
        if (isLastQuestion) return;

        setIsAdvancing(true);
        const nextIndex = currentIndex + 1;

        const response = await updateQuestionIndex(sessionId, nextIndex);

        if (response.error) {
            toast.error(response.error);
        } else {
            setCurrentIndex(nextIndex);
            setViewState("QUESTION"); // Flip back to the question view
        }
        setIsAdvancing(false);
    };

    const handleEndGame = async () => {
        setIsAdvancing(true);
        const response = await endSessionEarly(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsAdvancing(false);
        } else {
            toast.success("Game Finished!");
            router.push(`/dashboard/reports/${sessionId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-inter">
            {/* Top Bar */}
            <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md shrink-0">
                <h1 className="text-xl font-bold text-white">{quizTitle}</h1>

                {timeLeft !== null && viewState === "QUESTION" && (
                    <div className="flex items-center gap-2 bg-rose-500/20 text-rose-400 px-4 py-2 rounded-full font-bold border border-rose-500/30">
                        <Timer className="w-5 h-5" />
                        <span className="text-xl">{timeLeft}s</span>
                    </div>
                )}

                <div className="bg-slate-700 px-4 py-2 rounded-full text-slate-300 font-bold text-sm">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full">

                {viewState === "QUESTION" ? (
                    // ----------------------------------------------------
                    // VIEW A: THE QUESTION
                    // ----------------------------------------------------
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8 flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8">
                            {currentQuestion.questionText}
                        </h2>

                        <div className={`grid gap-4 w-full ${currentQuestion.options?.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {currentQuestion.options?.map((option: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl font-bold text-lg border-2 ${option === currentQuestion.correctAnswer
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                >
                                    {option}
                                    {option === currentQuestion.correctAnswer && " (Correct)"}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // ----------------------------------------------------
                    // VIEW B: THE STANDINGS (Race Track or Solo)
                    // ----------------------------------------------------
                    <div className="mb-8 flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-500">
                        {maxFactions > 0 ? (
                            <FactionRaceTrack factions={factions} participants={participants} />
                        ) : (
                            <div className="bg-white rounded-3xl p-6 shadow-xl max-w-2xl mx-auto w-full">
                                <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">Top 10 Players</h2>
                                <div className="flex flex-col gap-2">
                                    {participants
                                        .sort((a, b) => b.totalScore - a.totalScore)
                                        .slice(0, 10)
                                        .map((p, idx) => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-slate-100">
                                                <span className="font-bold text-lg text-slate-700">
                                                    {idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : `${idx + 1}. `}
                                                    {p.nickname}
                                                </span>
                                                <span className="font-black text-xl text-[#4ce0a3]">{p.totalScore}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Control Footer */}
                <div className="flex justify-between items-center shrink-0 mt-4 w-full">
                    {!isLastQuestion ? (
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to end this game early? All players will be sent to the final podium.")) {
                                    handleEndGame();
                                }
                            }}
                            disabled={isAdvancing}
                            className="text-rose-500 hover:text-rose-400 font-bold px-4 py-2 transition-colors disabled:opacity-50"
                        >
                            End Game Early
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <div className="flex justify-end">
                        {viewState === "QUESTION" ? (
                            <button
                                onClick={() => setViewState("STANDINGS")}
                                className="bg-blue-500 hover:bg-blue-400 text-white text-2xl font-black px-10 py-5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3"
                            >
                                <BarChart3 className="w-8 h-8" />
                                View Standings
                            </button>
                        ) : !isLastQuestion ? (
                            <button
                                onClick={handleNextQuestion}
                                disabled={isAdvancing}
                                className="bg-indigo-500 hover:bg-indigo-400 text-white text-2xl font-black px-10 py-5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isAdvancing ? <Loader2 className="w-8 h-8 animate-spin" /> : "Next Question"}
                                {!isAdvancing && <ChevronRight className="w-8 h-8" />}
                            </button>
                        ) : (
                            <button
                                onClick={handleEndGame}
                                disabled={isAdvancing}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white text-2xl font-black px-10 py-5 rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isAdvancing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Trophy className="w-8 h-8" />}
                                Show Final Podium
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}