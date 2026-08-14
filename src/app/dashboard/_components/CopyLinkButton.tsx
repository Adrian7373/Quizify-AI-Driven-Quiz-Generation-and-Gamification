"use client"

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface CopyLinkButtonProps {
    joinCode: string;
}

export default function CopyLinkButton({ joinCode }: CopyLinkButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        // Construct the full join URL based on the current domain
        const link = `${window.location.origin}/join?pin=${joinCode}`;

        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success("Join link copied!");

            // Reset the button state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link.");
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`mt-2 flex items-center justify-center gap-1.5 w-full text-xs font-bold py-1.5 rounded-md transition-colors ${copied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                }`}
        >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
        </button>
    );
}