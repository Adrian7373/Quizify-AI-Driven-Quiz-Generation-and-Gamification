import Logo from "@/app/_components/Logo";
import { Menu } from "lucide-react";


export default function SettingsLoading() {
    return (
        <div className="flex flex-col xl:items-center">
            <div className="w-full py-6 px-5 bg-darker">
                {/* Top Bar */}
                <div className="flex gap-2 items-center justify-between">
                    <div className="w-20 h-8 bg-slate-300 animate-pulse rounded-md"></div>
                    <div className="w-18 h-7 bg-slate-300 animate-pulse rounded-md"></div>
                </div>
            </div>

            <main className="flex-col pt-10 px-4 md:px-14 max-w-7xl">
                {/* Header */}
                <div className="flex-col">
                    <div className="w-40 h-10 bg-slate-300 animate-pulse mb-2 rounded-sm"></div>
                    <div className="w-3/4 h-5 bg-slate-300 animate-pulse mb-2 rounded-sm min-[414px]:w-90"></div>
                    <div className="w-1/2 h-5 bg-slate-300 animate-pulse mb-2 rounded-sm min-[414px]:hidden"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-6 border-b border-slate-200 mt-9 md:hidden">
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2 hidden sm:block" />
                </div>


                <div className="flex flex-col md:flex-row md:justify-between gap-10 xl:w-7xl">

                    {/* tabs skeleton for md */}
                    <div className="max-[767px]:hidden mt-4">
                        <div className="w-60 h-9 bg-slate-300 animate-pulse rounded-sm mb-7"></div>
                        <div className="w-30 h-6 bg-slate-300 animate-pulse rounded-sm mb-7"></div>
                        <div className="w-30 h-6 bg-slate-300 animate-pulse rounded-sm mb-7"></div>
                        <div className="w-30 h-6 bg-slate-300 animate-pulse rounded-sm mb-7"></div>
                    </div>

                    {/* Card skeleton */}
                    <div className="flex-col p-6 md:mt-4 mt-7 border-1 border-slate-200 rounded-2xl mb-8 shadow-sm md:flex-1">
                        <div className="w-48 h-8 bg-slate-300 animate-pulse rounded-sm mt-2"></div>
                        <div className="flex-col mt-5">
                            <div className="w-30 h-5 bg-slate-300 animate-pulse rounded-sm mb-2"></div>
                            <div className="w-full h-13 bg-slate-300 animate-pulse rounded-sm max-w-150"></div>
                        </div>
                        <div className="flex-col mt-5">
                            <div className="w-30 h-5 bg-slate-300 animate-pulse rounded-sm mb-2"></div>
                            <div className="w-full h-13 bg-slate-300 animate-pulse rounded-sm max-w-150"></div>
                        </div>
                        <div className="w-full h-3 bg-slate-300 animate-pulse rounded-sm mt-2 max-w-100"></div>
                        <div className="w-1/2 h-3 bg-slate-300 animate-pulse rounded-sm mt-2 min-[536px]:hidden"></div>
                        <div className="flex-col mt-7">
                            <div className="w-30 h-5 bg-slate-300 animate-pulse rounded-sm mb-2"></div>
                            <div className="w-3/4 h-13 bg-slate-300 animate-pulse rounded-sm max-w-60"></div>
                        </div>
                        <div className="w-full h-3 bg-slate-300 animate-pulse rounded-sm mt-2 md:w-40"></div>
                        <div className="w-1/2 h-3 bg-slate-300 animate-pulse rounded-sm mt-2 sm:max-w-20"></div>

                        {/* button */}
                        <div className="w-45 h-11 bg-slate-300 animate-pulse rounded-sm mt-7"></div>

                    </div>
                </div>

            </main>
        </div>
    )
}