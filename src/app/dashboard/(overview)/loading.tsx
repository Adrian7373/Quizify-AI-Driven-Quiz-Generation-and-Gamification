import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center">
            {/* Top Bar Skeleton */}
            <div className="w-full h-24 bg-darker border-b border-slate-200 mb-8" />

            <div className="w-full h-32 mb-5 bg-slate-200 rounded-lg animate-pulse max-w-3xl"></div>

            <main className="flex-1 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-12">

                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-5 mb-8">
                    <div className="space-y-2">
                        <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-5 w-64 bg-slate-200 rounded-lg animate-pulse" />
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="h-11 w-32 bg-slate-200 rounded-xl animate-pulse" />
                        <div className="h-11 w-40 bg-indigo-100 rounded-xl animate-pulse" />
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-6 border-b border-slate-200 mb-8">
                    <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                </div>

                {/* Grid of Skeleton Cards (Matches your 9 items per page) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-48 flex flex-col">
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse shrink-0" />
                            </div>

                            {/* Card Body */}
                            <div className="space-y-2 mb-auto">
                                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
                                <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="h-4 w-20 bg-slate-100 rounded ml-auto animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading Spinner at the bottom for good measure */}
                <div className="flex justify-center mt-12">
                    <Loader2 className="w-8 h-8 text-[#4ce0a3] animate-spin" />
                </div>
            </main>
        </div>
    );
}