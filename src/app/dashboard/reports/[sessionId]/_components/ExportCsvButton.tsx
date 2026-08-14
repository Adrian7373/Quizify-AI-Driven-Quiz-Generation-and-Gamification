"use client"

import { FileSpreadsheet } from "lucide-react"
import toast from "react-hot-toast"

// Define the shape of the data we need
interface ParticipantData {
    nickname: string;
    totalScore: number;
    maxStreak: number;
    faction?: { name: string } | null;
}

interface ExportCsvButtonProps {
    quizTitle: string;
    participants: ParticipantData[];
}

export default function ExportCsvButton({ quizTitle, participants }: ExportCsvButtonProps) {

    // The logic lives inside the Client Component now!
    const handleExportCsv = () => {
        if (!participants || participants.length === 0) {
            toast.error("No data to export!");
            return;
        }

        const headers = ["Rank", "Nickname", "Faction/Team", "Total Score", "Max Streak"];
        const sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore);

        const rows = sortedParticipants.map((p, index) => [
            index + 1,
            p.nickname,
            p.faction?.name || "Solo",
            p.totalScore,
            p.maxStreak || 0
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(value => `"${value}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute("download", `${quizTitle.replace(/\s+/g, '_')}_Results.csv`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("CSV Downloaded!");
    };

    return (
        <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 max-h-sm rounded-xl transition-all active:scale-95 shadow-md shadow-slate-900/20"
        >
            <FileSpreadsheet className="w-5 h-5 text-[#4ce0a3]" />
            Export CSV
        </button>
    )
}