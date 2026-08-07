"use client"

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getActiveLiveSession } from "@/app/actions";
import { Radio } from "lucide-react";
import Link from "next/link";

export default function ActiveLiveWidget({ userId }: { userId: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [activeSession, setActiveSession] = useState<any>(null);

    useEffect(() => {
        // Fetch on mount and whenever the pathname changes
        async function checkSession() {
            if (!userId) return;
            const response = await getActiveLiveSession(userId);
            setActiveSession(response.session);
        }
        checkSession();
    }, [userId, pathname]);

    // Don't show the widget if they are already on the host control pages
    if (!activeSession || pathname.includes(`/host/${activeSession.id}`)) {
        return null;
    }

    // Route dynamically: if waiting, go to lobby; if in progress, go to the play controller
    const returnUrl = activeSession.status === "WAITING"
        ? `/host/${activeSession.id}`
        : `/host/${activeSession.id}/play`;

    return (
        <Link
            href={returnUrl}
            className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white p-3 pr-5 rounded-full shadow-2xl transition-all hover:scale-105 border border-slate-700 animate-in slide-in-from-bottom-10"
        >
            <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-rose-500 items-center justify-center">
                    <Radio className="w-5 h-5 text-white" />
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Live Game Running</span>
                <span className="text-sm font-semibold truncate max-w-[150px]">{activeSession.quiz.title}</span>
            </div>
        </Link>
    );
}