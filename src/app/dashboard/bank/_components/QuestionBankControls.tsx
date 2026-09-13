"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

interface BankControlsProps {
    initialSearch: string,
    initialType: string
}

export default function QuestionBankControls({ initialSearch, initialType }: BankControlsProps) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedQuestionType, setSelectedQuestionType] = useState("ALL");
    const [searchInput, setSearchInput] = useState(initialSearch);

    // --- Debounced URL Update ---
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            let hasChanges = false;

            // Handle Search Text Changes
            if (searchInput !== initialSearch) {
                if (searchInput) params.set('search', searchInput);
                else params.delete('search');
                hasChanges = true;
            }

            if (selectedQuestionType !== initialType) {
                if (selectedQuestionType !== "ALL") params.set('type', selectedQuestionType);
                else params.delete('type');
                hasChanges = true;
            }

            if (hasChanges) {
                params.set('page', '1'); // Always reset to page 1 on a new search/filter
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, selectedQuestionType, pathname, router, searchParams, initialSearch, initialType]);


    return (<div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full md:w-96">
                    <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search questions or quiz titles..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#4ce0a3] focus:outline-none transition-colors"
                    />
                </div>
                <div className="shrink-0 w-full sm:w-48">
                    <select
                        value={selectedQuestionType}
                        onChange={(e) => setSelectedQuestionType(e.target.value)}
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
    </div>)
}