"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGameSession } from "@/app/actions";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteSessionButtonProps {
    sessionId: string;
    hostId: string;
}

export default function DeleteSessionButton({ sessionId, hostId }: DeleteSessionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this report? All student grades for this session will be permanently lost.")) return;

        setIsDeleting(true);
        const response = await deleteGameSession(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsDeleting(false);
        } else {
            toast.success("Session deleted successfully.");
            router.refresh();
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Delete Session"
        >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        </button>
    )
}