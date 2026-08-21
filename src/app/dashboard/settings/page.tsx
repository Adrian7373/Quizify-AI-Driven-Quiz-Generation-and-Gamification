import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NavBar from "@/app/_components/NavBar";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        redirect("/");
    }

    // Fetch full user details from Prisma
    const appUser = await prisma.user.findUnique({
        where: { id: authUser.id },
    });

    if (!appUser) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <NavBar user={appUser} />

            <main className="flex-1 pt-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account preferences and configurations.</p>
                </div>

                <SettingsClient user={appUser} />
            </main>
        </div>
    );
}