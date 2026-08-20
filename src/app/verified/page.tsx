import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VerifiedPage() {
    return (
        <div className="bg-darker flex justify-center items-center w-full min-h-dvh py-10">
            <div className="bg-dark p-10 flex flex-col justify-center items-center shadow-md w-full mx-6 max-w-[500px] rounded-lg text-center">

                {/* Success Icon */}
                <div className="bg-mint/20 p-4 rounded-full mb-6">
                    <CheckCircle2 size={48} className="text-mint" />
                </div>

                <h1 className="text-white text-2xl font-semibold mb-3">
                    Account Verified!
                </h1>

                <p className="text-gray-300 text-sm mb-8">
                    Your email address has been successfully confirmed. You are now logged in and ready to start generating AI quizzes.
                </p>

                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                    Continue to Dashboard
                </Link>
            </div>
        </div>
    );
}