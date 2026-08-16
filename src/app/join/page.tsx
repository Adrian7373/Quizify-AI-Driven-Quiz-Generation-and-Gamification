"use client"

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinGameSession, checkFactionStatus, createFaction, joinFaction } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Crown, Users, ShieldAlert } from "lucide-react";
import Logo from "@/app/_components/Logo";

interface FactionData {
    id: string;
    name: string;
    leaderId: string;
    memberCount: number;
}

function JoinForm() {
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const urlPin = searchParams.get("pin") || "";

    // Flow States
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [pin, setPin] = useState(urlPin);
    const [nickname, setNickname] = useState("");
    const [factionName, setFactionName] = useState("");

    // Session & Realtime Data
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [role, setRole] = useState<"LEADER" | "MEMBER" | null>(null);
    const [factions, setFactions] = useState<FactionData[]>([]);
    const [maxFactions, setMaxFactions] = useState(4);

    // UI States
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Auto-focus management
    useEffect(() => {
        if (step === 1) document.getElementById("pin-input")?.focus();
        if (step === 2) document.getElementById("nickname-input")?.focus();
        if (step === 3 && role === 'LEADER') document.getElementById("faction-name-input")?.focus();
    }, [step, role]);

    // REALTIME LISTENER
    useEffect(() => {
        if (!sessionId || role !== 'MEMBER') return;

        const channel = supabase
            .channel('faction-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Faction', filter: `sessionId=eq.${sessionId}` },
                async () => {
                    const status = await checkFactionStatus(sessionId);
                    if (status.factions) setFactions(status.factions);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Participant', filter: `sessionId=eq.${sessionId}` },
                async () => {
                    const status = await checkFactionStatus(sessionId);
                    if (status.factions) setFactions(status.factions);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, role, supabase]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (pin.trim().length < 5) return setError("Game PINs are usually 6 digits.");
        setStep(2);
    };

    const handleNicknameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!nickname.trim()) return setError("Please enter a nickname.");

        setIsLoading(true);

        const response = await joinGameSession(pin, nickname);

        if (response.error) {
            setError(response.error);
            setIsLoading(false);
            if (response.error.includes("PIN")) setStep(1);
            return;
        }

        setSessionId(response.sessionId!);
        setParticipantId(response.participantId!);
        localStorage.setItem(`participant_${response.sessionId}`, response.participantId!);

        if (response.mode === "ASYNC") {
            router.push(`/play/${response.sessionId}`);
            return;
        }

        const status = await checkFactionStatus(response.sessionId!);
        setMaxFactions(status.maxFactions);
        setFactions(status.factions);

        if (status.maxFactions === 0) {
            router.push(`/play/${response.sessionId}`);
            return;
        }

        if (status.factions.length < status.maxFactions) {
            setRole("LEADER");
            setStep(3);
        } else {
            setRole("MEMBER");
            setStep(4);
        }

        setIsLoading(false);
    };

    const handleCreateFaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factionName.trim()) return;
        setIsLoading(true);

        const res = await createFaction(sessionId!, participantId!, factionName.trim().toUpperCase());
        if (res.success) {
            router.push(`/play/${sessionId}`);
        } else {
            setError(res.error || "Failed to create faction.");
            setIsLoading(false);
        }
    };

    const handleJoinFaction = async (factionId: string) => {
        setIsLoading(true);
        const res = await joinFaction(participantId!, factionId);

        if (res.success) {
            router.push(`/play/${sessionId}`);
        } else {
            setError(res.error || "Failed to join faction.");
            setIsLoading(false);
        }
    };

    const isWaitingForLeaders = role === 'MEMBER' && factions.length < maxFactions;

    return (
        <div className={`bg-white p-8 rounded-xl shadow-2xl transition-all duration-300 ${step >= 4 ? 'max-w-2xl w-full' : 'max-w-sm w-full'}`}>
            {/* STEP 1: PIN */}
            {step === 1 && (
                <form onSubmit={handlePinSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Ready to play?</h1>
                    <input
                        id="pin-input"
                        type="text"
                        placeholder="Game PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={6}
                        className="w-full text-center text-3xl font-bold tracking-[0.2em] p-4 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] transition-colors"
                    />
                    <button type="submit" disabled={!pin} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-lg text-lg transition-colors">
                        Enter
                    </button>
                </form>
            )}

            {/* STEP 2: NICKNAME */}
            {step === 2 && (
                <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
                    <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Join Game</h1>
                    <input
                        id="nickname-input"
                        type="text"
                        placeholder="Nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={15}
                        className="w-full text-center text-xl font-bold p-4 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] transition-colors"
                    />
                    <button type="submit" disabled={!nickname || isLoading} className="relative flex items-center justify-center w-full bg-[#4ce0a3] hover:bg-[#3bc48b] disabled:bg-slate-300 text-slate-900 font-bold py-4 rounded-lg text-lg transition-colors">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Go!"}
                    </button>
                </form>
            )}

            {/* STEP 3: LEADER NAMING */}
            {step === 3 && role === 'LEADER' && (
                <form onSubmit={handleCreateFaction} className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-center mb-2">
                        <div className="bg-amber-100 p-4 rounded-full">
                            <Crown className="w-10 h-10 text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 text-center">You are a Faction Leader!</h1>
                    <p className="text-center text-slate-500 text-sm font-medium mb-2">You are one of the first {maxFactions} to join. Establish your faction's name to let others join.</p>

                    <input
                        id="faction-name-input"
                        type="text"
                        placeholder="Faction Name (e.g. TITANS)"
                        value={factionName}
                        onChange={(e) => setFactionName(e.target.value)}
                        maxLength={20}
                        className="w-full text-center text-xl font-bold p-4 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 uppercase transition-colors"
                    />
                    <button type="submit" disabled={!factionName || isLoading} className="flex items-center justify-center w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-lg text-lg transition-colors">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Establish Faction"}
                    </button>
                </form>
            )}

            {/* STEP 4: MEMBER PICKER & WAITING ROOM */}
            {step === 4 && role === 'MEMBER' && (
                <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-black text-slate-800 mb-2">Choose Your Faction</h1>
                        {isWaitingForLeaders ? (
                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold bg-indigo-50 p-3 rounded-lg animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Waiting for leaders to establish all {maxFactions} factions...
                            </div>
                        ) : (
                            <p className="text-slate-500 font-medium">Select a banner below to pledge your allegiance.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {factions.map((faction) => (
                            <button
                                key={faction.id}
                                onClick={() => handleJoinFaction(faction.id)}
                                disabled={isLoading}
                                className="group relative flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-[#4ce0a3] hover:bg-[#4ce0a3]/5 transition-all disabled:opacity-50 hover:shadow-lg"
                            >
                                <ShieldAlert className="w-12 h-12 text-slate-300 group-hover:text-[#4ce0a3] mb-4 transition-colors" />
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide mb-2">{faction.name}</h3>

                                <div className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                    <Users className="w-4 h-4" />
                                    <span>{faction.memberCount} Members</span>
                                </div>
                            </button>
                        ))}

                        {Array.from({ length: maxFactions - factions.length }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="flex flex-col items-center justify-center p-8 bg-slate-100 border-2 border-slate-200 border-dashed rounded-2xl opacity-50">
                                <div className="w-12 h-12 bg-slate-200 rounded-full mb-4 animate-pulse" />
                                <div className="w-32 h-6 bg-slate-200 rounded-md mb-2 animate-pulse" />
                                <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}
        </div>
    );
}

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-inter p-4 relative">
            <div className="absolute top-8">
                <Logo />
            </div>

            <Suspense fallback={<div className="bg-white p-8 rounded-xl shadow-2xl flex items-center justify-center min-h-[300px] min-w-[300px]"><Loader2 className="w-8 h-8 animate-spin text-[#4ce0a3]" /></div>}>
                <JoinForm />
            </Suspense>
        </div>
    );
}