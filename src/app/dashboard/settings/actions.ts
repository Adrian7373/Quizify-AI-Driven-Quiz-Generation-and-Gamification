"use server"
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAccountProfile(userId: string, newName: string, newRole: "TEACHER" | "STUDENT") {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    if (currentUser?.name === newName && currentUser.role === newRole) {
        return { success: true, message: "No changes made." };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name: newName, role: newRole },
        });

        return { message: "Profile updated successfully." }
    } catch (error) {
        return { error: "Failed to update profile.", message: "Server error" }
    }
}

export async function logOutUser() {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { error: "Failed to logout user" }
        }

        revalidatePath("/")
    } catch (err) {
        return { error: "Failed to logout user" }
    }

}