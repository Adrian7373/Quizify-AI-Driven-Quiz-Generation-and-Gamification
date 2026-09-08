"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    tab: string;
}

export default function Pagination({ currentPage, totalPages, tab }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Link
                href={`?tab=${tab}&page=${currentPage - 1}`}
                className={`p-2 rounded-lg border border-slate-200 transition-colors ${currentPage <= 1
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-100 bg-white"
                    }`}
                aria-disabled={currentPage <= 1}
            >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
            </Link>

            <span className="text-sm font-medium text-slate-600">
                Page {currentPage} of {totalPages}
            </span>

            <Link
                href={`?tab=${tab}&page=${currentPage + 1}`}
                className={`p-2 rounded-lg border border-slate-200 transition-colors ${currentPage >= totalPages
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-100 bg-white"
                    }`}
                aria-disabled={currentPage >= totalPages}
            >
                <ChevronRight className="w-5 h-5 text-slate-700" />
            </Link>
        </div>
    );
}