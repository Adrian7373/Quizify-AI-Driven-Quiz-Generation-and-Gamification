"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGameSession } from "@/app/actions";
import { Trash2, Loader2, CircleX } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteSessionButtonProps {
    sessionId: string;
    hostId: string;
}

export default function DeleteSessionButton({ sessionId, hostId }: DeleteSessionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isShowing, setIsShowing] = useState(false);

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
        <>
            <button
                onClick={() => setIsShowing(true)}
                disabled={isDeleting}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                title="Delete Session"
            >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>

            {isShowing && (
                <div className="absolute bg-black/50 inset-0 z-50 flex items-center justify-center">
                    {/* Content */}
                    <div className="bg-white p-8 mx-8 flex flex-col gap-3">
                        <div className="flex items-center gap-2 justify-center mr-5">
                            <CircleX className="text-red-500 h-10 w-10" />
                            <p className="text-lg font-semibold">Delete Report?</p>
                        </div>
                        <p>Are you sure you want to <b>delete</b> this report? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsShowing(false)} className="px-8 py-3 border-1 border-gray-300 rounded-md">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-8 py-3 border-1 border-gray-300 rounded-md bg-red-500 text-white font-semibold">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    )
}