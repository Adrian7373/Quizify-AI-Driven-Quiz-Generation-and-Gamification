"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { CheckCircle2, CircleX, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface EndSessionButtonProps {
    sessionId: string;
    hostId: string;
}

export default function EndSessionButton({ sessionId, hostId }: EndSessionButtonProps) {
    const router = useRouter();
    const [isEnding, setIsEnding] = useState(false);
    const [isShowing, setIsShowing] = useState(false);

    const handleEndEarly = async () => {
        // Optional: Add a confirm dialog so they don't click it by accident

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
        <>
            <button
                onClick={() => setIsShowing(true)}
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

            {isShowing && (
                <div className="fixed bg-black/50 inset-0 z-50 flex items-center justify-center">
                    {/* Content */}
                    <div className="bg-white p-8 mx-8 flex flex-col gap-3 rounded-lg">
                        <div className="flex items-center gap-2 justify-center mr-5">
                            <CircleX className="text-red-500 h-10 w-10" />
                            <p className="text-lg font-semibold">End Early?</p>
                        </div>
                        <p>Are you sure you want to <b>end</b> this session early? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsShowing(false)} className="px-8 py-3 border-1 border-gray-200 rounded-md bg-gray-100 hover:bg-gray-300 cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={handleEndEarly} className="px-8 py-3 rounded-md bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-700">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}