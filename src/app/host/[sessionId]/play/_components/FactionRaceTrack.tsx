"use client"

import { Flag, Users, Trophy } from "lucide-react";

interface Faction {
    id: string;
    name: string;
}

interface Participant {
    id: string;
    nickname: string;
    factionId: string | null;
    totalScore: number;
}

interface FactionRaceTrackProps {
    factions: Faction[];
    participants: Participant[];
}

// A dynamic palette for the teams
const DYNAMIC_COLORS = [
    "bg-rose-500 shadow-rose-500/50",
    "bg-blue-500 shadow-blue-500/50",
    "bg-emerald-500 shadow-emerald-500/50",
    "bg-amber-400 shadow-amber-400/50",
    "bg-purple-500 shadow-purple-500/50",
    "bg-cyan-500 shadow-cyan-500/50",
];

export default function FactionRaceTrack({ factions, participants }: FactionRaceTrackProps) {
    // 1. Calculate total scores for each faction
    const factionScores = factions.map(faction => {
        const score = participants
            .filter(p => p.factionId === faction.id)
            .reduce((sum, p) => sum + p.totalScore, 0);

        return {
            ...faction,
            score
        };
    });

    // 2. Sort by score (highest at the top)
    const sortedFactions = [...factionScores].sort((a, b) => b.score - a.score);

    // 3. Find the highest score to calculate the progress bar percentages dynamically
    // We set a minimum of 1000 so the bars don't fly to 100% on the very first question
    const maxScore = Math.max(...sortedFactions.map(f => f.score), 1000);

    return (
        <div className="w-full bg-slate-900 rounded-3xl p-8 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Background dressing */}
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                <Flag className="w-64 h-64 text-white" />
            </div>

            <div className="flex justify-between items-center mb-10 border-b-2 border-slate-800 pb-6 relative z-10">
                <h2 className="text-4xl font-black text-white flex items-center gap-4 uppercase tracking-widest">
                    <Users className="text-indigo-400 w-10 h-10" />
                    Faction War
                </h2>
                <div className="bg-slate-800 px-6 py-2 rounded-full flex items-center gap-3 border border-slate-700">
                    <Trophy className="text-amber-400 w-5 h-5" />
                    <span className="text-slate-300 font-bold tracking-widest text-sm uppercase">Live Standings</span>
                </div>
            </div>

            <div className="flex flex-col gap-10 relative z-10">
                {sortedFactions.map((faction, index) => {
                    // Calculate width percentage (cap at 100%, minimum 5% so the score is visible)
                    const progressPercentage = Math.max(5, Math.min((faction.score / maxScore) * 100, 100));

                    // Assign a color based on their sorted position
                    const colorClass = DYNAMIC_COLORS[index % DYNAMIC_COLORS.length];
                    const isLeader = index === 0 && faction.score > 0;

                    return (
                        <div key={faction.id} className="relative">

                            {/* Track Background */}
                            <div className="w-full h-20 bg-slate-800/80 rounded-r-3xl border-y-2 border-r-2 border-slate-700 relative overflow-hidden flex items-center shadow-inner">

                                {/* Animated Progress Bar */}
                                <div
                                    className={`h-full ${colorClass} shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out flex items-center justify-end px-6 relative`}
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    {/* Shimmer effect on the bar */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>

                                    <span className="text-white font-black text-3xl drop-shadow-lg relative z-10">
                                        {faction.score.toLocaleString()}
                                    </span>
                                </div>

                                {/* Track Lines (Visual dressing) */}
                                <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#fff_15px,#fff_30px)] pointer-events-none mix-blend-overlay"></div>
                            </div>

                            {/* Custom Team Name Label */}
                            <div className="absolute -top-7 left-2 font-black text-slate-300 text-lg uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                                {isLeader && <span className="text-yellow-400 animate-bounce">👑</span>}
                                {faction.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}