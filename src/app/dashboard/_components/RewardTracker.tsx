"use client"

import { useEffect, useRef } from "react";
import { processLoginRewards } from "../actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RewardTracker({ userId }: { userId: string }) {
    const hasRun = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const fetchRewards = async () => {
            try {
                const result = await processLoginRewards(userId);

                if (result?.success && result.creditsAdded > 0) {
                    const { monthly, daily, streak } = result.breakdown;

                    let toastMessage = "";

                    if (monthly > 0) {
                        toastMessage += `Monthly Refill: +${monthly}\n`;
                    }
                    if (streak > 0) {
                        toastMessage += `🔥 Weekly Bonus: +${streak}\n`;
                    }
                    if (daily > 0) {
                        toastMessage += `Daily Login: +${daily}\n`;
                    }

                    // Show the toast with a dynamic icon based on the best reward
                    toast.success(toastMessage.trim(), {
                        duration: 10000000,
                    });

                    router.refresh();
                }
            } catch (error) {
                console.error("Failed to process rewards", error);
            }
        };

        fetchRewards();
    }, [userId, router]);

    return null;
}