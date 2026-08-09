"use client"

import { useState } from "react";
import { generateClassInsight } from "@/app/actions/generate";
import { Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AiInsightsCardProps {
    sessionId: string;
    initialInsight: string | null;
}

export default function AiInsightsCard({ sessionId, initialInsight }: AiInsightsCardProps) {
    const [insight, setInsight] = useState<string | null>(initialInsight);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const response = await generateClassInsight(sessionId);

        if (response.error) {
            toast.error(response.error);
        } else if (response.insight) {
            setInsight(response.insight);
            toast.success("AI Insights generated!");
        }
        setIsGenerating(false);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-1 shadow-xl mb-8 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-6 md:p-8 border border-indigo-500/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">AI Class Insights</h2>
                </div>

                {insight ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {insight.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-slate-300 leading-relaxed text-sm md:text-base">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <div>
                            <h3 className="text-white font-semibold mb-1">Analyze Class Performance</h3>
                            <p className="text-slate-400 text-sm">
                                Let AI analyze the most missed questions to identify conceptual gaps and suggest a warm-up activity for tomorrow.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 shrink-0"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing Data...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="w-5 h-5" />
                                    Generate Insights
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}