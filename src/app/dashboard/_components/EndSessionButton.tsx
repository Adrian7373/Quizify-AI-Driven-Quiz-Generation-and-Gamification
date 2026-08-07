"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface EndSessionButtonProps {
    sessionId: string;
    hostId: string;
}

export default function EndSessionButton({ sessionId, hostId }: EndSessionButtonProps) {
    const router = useRouter();
    const [isEnding, setIsEnding] = useState(false);

    const handleEndEarly = async () => {
        // Optional: Add a confirm dialog so they don't click it by accident
        if (!window.confirm("Are you sure you want to end this assignment early? Students will no longer be able to join or submit answers.")) {
            return;
        }

        setIsEnding(true);
        const response = await endSessionEarly(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsEnding(false);
        } else {
            toast.success("Assignment ended successfully.");
            // Refresh the server components to instantly move the item to the Completed tab
            router.refresh();
        }
    };

    return (
        <button
            onClick={handleEndEarly}
            disabled={isEnding}
            className="flex-1 sm:flex-none bg-rose-100 hover:bg-rose-200 text-rose-700 disabled:opacity-50 font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
            {isEnding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <CheckCircle2 className="w-4 h-4" />
            )}
            {isEnding ? "Ending..." : "End Early"}
        </button>
    );
}