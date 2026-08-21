"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Check, Copy, Loader2, Play, Users, X } from "lucide-react";
import { startGameSession } from "../actions";
import toast from "react-hot-toast";
import { deleteGameSession } from "@/app/actions";

interface HostLobbyClientProps {
    sessionId: string;
    joinCode: string;
    quizTitle: string;
    initialParticipants: { id: string; nickname: string }[];
    hostId: string;
}

export default function HostLobbyClient({ sessionId, joinCode, quizTitle, initialParticipants, hostId }: HostLobbyClientProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleCancelGame = async () => {
        if (!window.confirm("Are you sure you want to cancel this game?")) return;

        setIsCanceling(true);
        const response = await deleteGameSession(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsCanceling(false);
        } else {
            toast.success("Game cancelled.");
            router.push("/dashboard");
        }
    };

    const handleCopyLink = async () => {
        // Generates the magic link using the browser's current origin
        const joinLink = `${window.location.origin}/join?pin=${joinCode}`;
        await navigator.clipboard.writeText(joinLink);

        setIsCopied(true);
        toast.success("Join link copied!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    // 1. Initialize state with the Prisma data passed from the server
    const [participants, setParticipants] = useState(initialParticipants);

    // 2. ONLY use Supabase for the Realtime WebSockets
    useEffect(() => {
        const channel = supabase
            .channel('lobby-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Participant',
                    filter: `sessionId=eq.${sessionId}`
                },
                (payload) => {
                    const newParticipant = payload.new as { id: string, nickname: string };
                    setParticipants(prev => [...prev, newParticipant]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, supabase]);

    const handleStartGame = async () => {
        if (participants.length === 0) {
            if (!window.confirm("No one has joined yet. Start anyway?")) return;
        }

        toast.loading("Starting game...", { id: "start-game" });

        const response = await startGameSession(sessionId);

        if (response?.error) {
            toast.error(response.error, { id: "start-game" });
            return;
        }

        toast.success("Game started!", { id: "start-game" });
        router.push(`/host/${sessionId}/play`);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-inter">
            {/* Top Bar */}
            <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold text-white">{quizTitle}</h1>
                <div className="flex items-center gap-4 bg-slate-700 px-4 py-2 rounded-full">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span className="text-white font-bold">{participants.length} Players</span>
                </div>
            </div>

            {/* Giant PIN Display */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <p className="text-2xl text-slate-300 font-semibold mb-4 text-center">
                    Join at <span className="text-white font-black underline">https://quizify-ai-driven-quiz-generation-a-zeta.vercel.app/join</span> with PIN:
                </p>
                <div className="bg-white px-16 py-8 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.4)] mb-12">
                    <p className="text-8xl md:text-[10rem] font-black text-slate-900 tracking-[0.1em] leading-none text-center">
                        {joinCode}
                    </p>
                    <button
                        onClick={handleCopyLink}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold cursor-pointer text-lg transition-colors ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        {isCopied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        {isCopied ? "Link Copied!" : "Copy Join Link"}
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleCancelGame}
                        disabled={isCanceling}
                        className="flex items-center justify-center gap-2 px-12 py-6 text-xl font-black bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isCanceling ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                        Cancel Game
                    </button>

                    <button
                        onClick={handleStartGame}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-2xl font-black px-12 py-6 rounded-2xl shadow-xl transition-transform hover:scale-105 flex items-center gap-4"
                    >
                        <Play className="w-8 h-8" fill="currentColor" />
                        Start Game
                    </button>
                </div>
            </div>

            {/* Live Participant Name Grid */}
            <div className="h-64 bg-slate-800 p-6 overflow-y-auto">
                <div className="flex flex-wrap gap-3 justify-center max-w-5xl mx-auto">
                    {participants.map(p => (
                        <div key={p.id} className="bg-slate-700 text-white font-bold px-4 py-2 rounded-lg animate-in zoom-in duration-300">
                            {p.nickname}
                        </div>
                    ))}
                    {participants.length === 0 && (
                        <p className="text-slate-500 font-semibold animate-pulse mt-10">Waiting for players...</p>
                    )}
                </div>
            </div>
        </div>
    );
}