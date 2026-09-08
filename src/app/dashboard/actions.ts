"use server"
import prisma from "@/lib/prisma";

export async function processLoginRewards(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : new Date(0);
    const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const lastRefill = user.lastMonthlyRefill ? new Date(user.lastMonthlyRefill) : new Date(0);

    let newCredits = user.aiCredits;
    let newStreak = user.currentStreak;
    let newHighestStreak = user.highestStreak;

    let monthlyAdded = 0;
    let dailyAdded = 0;
    let streakAdded = 0;

    // --- 1. MONTHLY REFILL CHECK ---
    if (lastRefill.getMonth() !== now.getMonth() || lastRefill.getFullYear() !== now.getFullYear()) {
        if (newCredits < 20) {
            monthlyAdded = 20 - newCredits;
            newCredits = 20;
        }
    }

    // --- 2. DAILY LOGIN CHECK ---
    const timeDiff = today.getTime() - lastLoginDay.getTime();
    const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (daysSinceLastLogin > 0) {
        newCredits += 1;
        dailyAdded = 1;

        if (daysSinceLastLogin === 1) {
            newStreak += 1;
            if (newStreak % 7 === 0) {
                newCredits += 5;
                streakAdded = 5;
            }
        } else {
            newStreak = 1;
        }

        if (newStreak > newHighestStreak) {
            newHighestStreak = newStreak;
        }
    }

    // --- 3. SAVE TO DATABASE ---
    if (daysSinceLastLogin > 0 || lastRefill.getMonth() !== now.getMonth()) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                aiCredits: newCredits,
                currentStreak: newStreak,
                highestStreak: newHighestStreak,
                lastLoginDate: now,
                lastMonthlyRefill: lastRefill.getMonth() !== now.getMonth() ? now : user.lastMonthlyRefill
            }
        });
    }

    return {
        success: true,
        creditsAdded: newCredits - user.aiCredits,
        newStreak,
        breakdown: {
            monthly: monthlyAdded,
            daily: dailyAdded,
            streak: streakAdded
        }
    };
}