"use client"

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import GenerateQuizModal from "./GenerateQuizModal";

interface GenerateNewButtonProps {
    userId: string;
}

export default function GenerateNewButton({ userId }: GenerateNewButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900 font-bold text-sm sm:text-base px-3 sm:px-5 py-2.5 rounded-xl transition-colors shrink-0"
            >
                <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="whitespace-nowrap">Generate New</span>
            </button>

            {isModalOpen && (
                <GenerateQuizModal
                    userId={userId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}