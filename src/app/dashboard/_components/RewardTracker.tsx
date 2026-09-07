"use client"

import { useEffect, useRef } from "react";
import { processLoginRewards } from "../actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RewardTracker({ userId }: { userId: string }) {
    // Use a ref to ensure this strictly runs only once in React Strict Mode
    const hasRun = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const fetchRewards = async () => {
            try {
                const result = await processLoginRewards(userId);

                // If the action added credits, show a celebratory toast
                if (result?.success && result.creditsAdded > 0) {
                    toast.success(
                        `Daily Login! +${result.creditsAdded} Credits \nCurrent Streak: ${result.newStreak} days`,
                        { duration: 4000, icon: '🔥' }
                    );
                    router.refresh();
                }
            } catch (error) {
                console.error("Failed to process rewards", error);
            }
        };

        fetchRewards();
    }, [userId]);

    return null;
}