"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinGameSession } from "./actions";
import { Loader2 } from "lucide-react";
import Logo from "@/app/_components/Logo";

export default function JoinPage() {
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);
    const [pin, setPin] = useState("");
    const [nickname, setNickname] = useState("");

    const [error, setError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (pin.trim().length < 5) {
            return setError("Game PINs are usually 6 digits.");
        }
        setStep(2); // Move to nickname step
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!nickname.trim()) {
            return setError("Please enter a nickname.");
        }

        setIsJoining(true);

        const response = await joinGameSession(pin, nickname);

        if (response.error) {
            setError(response.error);
            setIsJoining(false);
            if (response.error.includes("PIN")) setStep(1); // Kick back to PIN step if invalid
        } else {
            // Store the participantId in localStorage so the play page knows WHO this device is
            localStorage.setItem(`participant_${response.sessionId}`, response.participantId!);

            // Redirect to the actual game screen
            router.push(`/play/${response.sessionId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-inter p-4">

            {/* Minimal Header */}
            <div className="absolute top-8">
                <Logo />
            </div>

            {/* The Game Box */}
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full transition-all duration-300">
                {step === 1 ? (
                    <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Ready to play?</h1>

                        <input
                            type="text"
                            placeholder="Game PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} // Force numbers only
                            maxLength={6}
                            autoFocus
                            className="w-full text-center text-3xl font-bold tracking-[0.2em] p-4 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] focus:bg-white transition-colors"
                        />

                        <button
                            type="submit"
                            disabled={!pin}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-lg text-lg transition-colors"
                        >
                            Enter
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                        <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Join Game</h1>

                        <input
                            type="text"
                            placeholder="Nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={15}
                            autoFocus
                            className="w-full text-center text-xl font-bold p-4 bg-slate-100 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] focus:bg-white transition-colors"
                        />

                        <button
                            type="submit"
                            disabled={!nickname || isJoining}
                            className="relative flex items-center justify-center w-full bg-[#4ce0a3] hover:bg-[#3bc48b] disabled:bg-slate-300 text-slate-900 font-bold py-4 rounded-lg text-lg transition-colors"
                        >
                            {isJoining ? <Loader2 className="w-6 h-6 animate-spin" /> : "Go!"}
                        </button>
                    </form>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-600 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
            </div>

        </div>
    );
}