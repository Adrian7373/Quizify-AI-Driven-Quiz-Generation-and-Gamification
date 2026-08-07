"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Play, Users } from "lucide-react";
import { startGameSession } from "../actions";
import toast from "react-hot-toast";

interface HostLobbyClientProps {
    sessionId: string;
    joinCode: string;
    quizTitle: string;
    initialParticipants: { id: string; nickname: string }[];
}

export default function HostLobbyClient({ sessionId, joinCode, quizTitle, initialParticipants }: HostLobbyClientProps) {
    const router = useRouter();
    const supabase = createClient();

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
                    Join at <span className="text-white font-black underline">quizify.com/join</span> with PIN:
                </p>
                <div className="bg-white px-16 py-8 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.4)] mb-12">
                    <p className="text-8xl md:text-[10rem] font-black text-slate-900 tracking-[0.1em] leading-none text-center">
                        {joinCode}
                    </p>
                </div>

                <button
                    onClick={handleStartGame}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white text-2xl font-black px-12 py-6 rounded-2xl shadow-xl transition-transform hover:scale-105 flex items-center gap-4"
                >
                    <Play className="w-8 h-8" fill="currentColor" />
                    Start Game
                </button>
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