"use client";
import { ArrowLeft, Trophy, Users, Target, Flame } from "lucide-react";
import { useEffect } from "react";

export default function ReportsLoading() {
    const tableRows = Array(5).fill(null);

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (

        <div className="flex flex-col lg:items-center">
            <div className="w-full py-6 px-5 bg-darker">
                {/* Top Bar */}
                <div className="flex gap-2 items-center justify-between">
                    <div className="w-20 h-8 bg-slate-300 animate-pulse rounded-md"></div>
                    <div className="w-18 h-7 bg-slate-300 animate-pulse rounded-md"></div>
                </div>
            </div>

            <div className="animate-pulse px-6 py-4 md:px-12 max-4xl">
                {/* Header Section */}
                <div className="mb-8 lg:w-4xl">
                    <div className="inline-flex items-center gap-2 text-slate-300 font-semibold text-sm mb-4">
                        <ArrowLeft className="w-4 h-4 text-sm" /> Back to Dashboard
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex gap-5 w-full md:w-auto">
                            <div className="w-full">
                                {/* Title */}
                                <div className="h-10 w-64 md:w-96 bg-slate-200 rounded-lg mb-3"></div>
                                {/* Date / Subtitle */}
                                <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
                            </div>
                            {/* Export Button Placeholder */}
                            <div className="hidden md:block h-12 w-36 bg-slate-200 rounded-xl shrink-0"></div>
                        </div>
                        {/* Game PIN Box */}
                        <div className="h-[72px] w-full md:w-28 bg-white border border-slate-200 rounded-lg shrink-0"></div>
                    </div>
                </div>

                {/* AI Insights Card (Dark Theme Skeleton) */}
                <div className="bg-slate-900 rounded-2xl p-7 mb-8 border border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                        <div className="h-7 w-48 bg-slate-800 rounded-md"></div>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-md mb-3"></div>
                    <div className="h-4 w-5/6 bg-slate-800 rounded-md mb-3"></div>
                    <div className="h-4 w-4/6 bg-slate-800 rounded-md"></div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {[Users, Target, Flame].map((Icon, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-slate-100">
                                <Icon className="w-6 h-6 text-slate-300" />
                            </div>
                            <div>
                                <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                                <div className="h-8 w-12 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-slate-700" /> <span className="h-5 w-32 bg-slate-800 rounded"></span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {Array(6).fill(null).map((_, i) => (
                                        <th key={i} className="px-6 py-5">
                                            <div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((_, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0">
                                        <td className="px-6 py-5 text-center"><div className="h-5 w-5 bg-slate-200 rounded-full mx-auto"></div></td>
                                        <td className="px-6 py-5"><div className="h-5 w-32 bg-slate-200 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-5 w-12 bg-slate-200 rounded ml-auto"></div></td>
                                        <td className="px-6 py-5 bg-slate-50 border-x border-slate-100"><div className="h-5 w-16 bg-slate-200 rounded mx-auto"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-200 rounded-full mx-auto"></div></td>
                                        <td className="px-6 py-5"><div className="h-5 w-24 bg-slate-200 rounded mx-auto"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}