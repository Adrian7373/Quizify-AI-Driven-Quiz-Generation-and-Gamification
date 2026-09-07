"use server"
import prisma from "@/lib/prisma";

export async function processLoginRewards(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Default to a date far in the past if null
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : new Date(0);
    const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

    const lastRefill = user.lastMonthlyRefill ? new Date(user.lastMonthlyRefill) : new Date(0);

    // Prepare our updates
    let newCredits = user.aiCredits;
    let newStreak = user.currentStreak;
    let newHighestStreak = user.highestStreak;
    let receivedBonus = false;

    // --- 1. MONTHLY REFILL CHECK ---
    // If the last refill was in a previous month (or year)
    if (lastRefill.getMonth() !== now.getMonth() || lastRefill.getFullYear() !== now.getFullYear()) {
        // Top up to 20 ONLY if they are below 20
        newCredits = Math.max(newCredits, 20);
    }

    // --- 2. DAILY LOGIN CHECK ---
    const timeDiff = today.getTime() - lastLoginDay.getTime();
    const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (daysSinceLastLogin > 0) {
        // It's a new day! Add 1 daily credit
        newCredits += 1;
        receivedBonus = true;

        if (daysSinceLastLogin === 1) {
            // Logged in exactly yesterday: increment streak
            newStreak += 1;

            // Check for the 7-day bonus!
            if (newStreak % 7 === 0) {
                newCredits += 5; // Streak bonus
            }
        } else {
            // Logged in more than 1 day ago: streak broken.
            newStreak = 1;
        }

        // Update highest streak
        if (newStreak > newHighestStreak) {
            newHighestStreak = newStreak;
        }
    }

    // --- 3. SAVE TO DATABASE ---
    // Only hit the database if a new day or month has actually occurred
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
        newStreak
    };
}