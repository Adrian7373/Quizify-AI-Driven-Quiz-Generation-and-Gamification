import Logo from "@/app/_components/Logo";
import { ArrowLeft, Menu, Search } from "lucide-react";
import Link from "next/link";


export default function BankLoading() {
    const skeletonItems = Array(6).fill(null);

    return (
        <div className="font-inter">

            <div className="print:hidden fixed w-full bg-darker flex py-4 items-center justify-between px-4 z-50 font-inter">
                <div className="flex gap-2 items-center">
                    <Menu strokeWidth={3} className="w-10 h-10 text-white cursor-pointer" />
                    <Logo />
                </div>

                <div className="flex h-9 px-16 items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 animate-pulse">
                </div>
            </div>

            <div className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full pb-32">
                <div className="mb-8 pt-27">

                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4ce0a3] transition-colors font-semibold text-sm mb-4">
                        <ArrowLeft className="w-4 h-4 text-black" /> Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">Question Bank</h1>
                            <p className="text-slate-500 mt-1">Mix and match your past questions to create a new quiz.</p>
                        </div>

                        {/* Interactive Client Component */}

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto sm:mb-6">
                                <div className="relative w-full md:w-96">
                                    <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search questions or quiz titles..."
                                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4ce0a3] focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="shrink-0 w-full sm:w-48">
                                    <select
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4ce0a3] focus:outline-none transition-colors bg-white font-semibold text-slate-700 cursor-pointer appearance-none"
                                    >
                                        <option value="ALL">All Types</option>
                                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                        <option value="TRUE_FALSE">True/False</option>
                                        <option value="IDENTIFICATION">Identification</option>
                                        <option value="ESSAY">Essay</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="relative animate-pulse w-full">
                    {/* List Controls Placeholder (Showing X of Y) */}
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="h-4 w-48 bg-slate-200 rounded"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    </div>

                    {/* Questions Grid Placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skeletonItems.map((_, index) => (
                            <div
                                key={index}
                                className="p-5 rounded-xl border-2 border-slate-200 bg-white flex gap-4"
                            >
                                {/* Checkbox Placeholder */}
                                <div className="shrink-0 mt-1">
                                    <div className="w-6 h-6 bg-slate-200 rounded flex-shrink-0"></div>
                                </div>

                                {/* Content Placeholder */}
                                <div className="min-w-0 flex-1">
                                    {/* Quiz Title Line */}
                                    <div className="h-3 w-32 bg-slate-200 rounded mb-3"></div>

                                    {/* Question Text (Simulating 2 lines) */}
                                    <div className="h-5 w-3/4 bg-slate-300 rounded mb-2"></div>
                                    <div className="h-5 w-1/2 bg-slate-300 rounded mb-4"></div>

                                    {/* Answer Block */}
                                    <div className="h-11 w-full bg-slate-200 rounded-lg border border-slate-100"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls Placeholder */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                    </div>
                </div>
            </div>

        </div>
    );
}