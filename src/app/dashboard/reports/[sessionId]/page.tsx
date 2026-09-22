import { createClient } from "@/utils/supabase/server";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReportData from "./_components/ReportData";
import { Suspense } from "react";
import ReportSkeleton from "./_components/ReportSkeleton";
import { resolve } from "node:dns";

interface ReportPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
    const { sessionId } = await params;

    // 1. Authenticate the User
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) throw new Error("Please log in first.");

    let appUser = null;
    const userResponse = await getUser(authUser.id);
    if (userResponse.user) appUser = userResponse.user;



    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <NavBar user={appUser} />

            <main className="flex-1 pt-24 px-6 md:px-12 max-w-5xl mx-auto w-full pb-12">
                {/* Header Section */}
                <div className="mb-8">
                    <Link href="/dashboard?tab=assignments" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4ce0a3] transition-colors font-semibold text-sm mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <Suspense fallback={<ReportSkeleton />}>
                        <ReportData userId={appUser?.id ?? ""} sessionId={sessionId} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}