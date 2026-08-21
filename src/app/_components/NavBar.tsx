"use client"
import { CirclePoundSterling, CircleUserRound, Cog, CreditCard, LayoutDashboard, LogOut, Menu, PanelRightClose, Plus } from "lucide-react";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppUser } from "../page";
import SignupModal from "./SignUpModal";
import Link from "next/link";
import { logOutUser } from "../actions";
import toast from "react-hot-toast";

interface NavBarProps {
    user: AppUser | null
    onOpenLocalQuiz?: (quiz: any) => void
    activeQuizId?: string | null
}

export default function NavBar({ user, onOpenLocalQuiz, activeQuizId }: NavBarProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const pathname = usePathname();

    // Loading state of logout
    const [isPending, setIsPending] = useState(false);

    const [localQuizzes, setLocalQuizzes] = useState<any[]>([]);

    // Fetch from local storage when the component mounts
    useEffect(() => {
        if (!user) {
            const savedQuizzes = localStorage.getItem('anon_quizzes');
            if (savedQuizzes) {
                setLocalQuizzes(JSON.parse(savedQuizzes));
            }
        }
    }, [user, isOpen]);

    const toggleMenu = () => {
        setIsOpen((prev) => !prev)
    }

    const toggleSignIn = () => {
        setIsSigningIn((prev) => !prev)
    }

    const toggleLogout = () => {
        setIsLoggingOut((prev) => !prev)
    }

    const handleLogOut = async () => {
        setIsPending(true);

        const response = await logOutUser();

        if (response?.error) {
            toast.error("Failed to logout user. Server error")
            setIsPending(false);
            setIsLoggingOut(false);
            return;
        }

        // Success: close modal, stop pending, refresh server components
        setIsPending(false);
        setIsLoggingOut(false);
        toast.success("Logged out")
        router.refresh();
    }

    return (
        <div className="print:hidden fixed w-full bg-darker flex py-4 items-center justify-between px-4 z-50 font-inter">
            <div className="flex gap-2 items-center">
                <Menu onClick={toggleMenu} strokeWidth={3} className="w-10 h-10 text-white cursor-pointer" />
                <Logo />
            </div>
            {user && (
                <div className="flex items-center gap-1">
                    <CirclePoundSterling fill="gold" className="text-gray-800" />
                    <p className="text-white">{user?.aiCredits}</p>
                </div>
            )}
            <button onClick={toggleSignIn} hidden={!!user} className="bg-white px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-gray-300">Sign In</button>

            <div
                onClick={toggleMenu}
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
            >
                <aside
                    onClick={(e) => e.stopPropagation()}
                    className={`fixed top-0 left-0 h-full bg-darker z-50 w-72 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="p-4 flex flex-col h-full">

                        <div className="flex justify-between items-center mb-10 shrink-0">
                            <Logo />
                            <PanelRightClose onClick={toggleMenu} className="-scale-x-100 w-6 h-6 text-white cursor-pointer hover:text-slate-300" />
                        </div>

                        <div className="text-white flex-1 flex flex-col min-h-0 pb-4">
                            <div className="flex flex-col py-2 gap-2 mb-6 shrink-0">
                                <Link href="/" className="flex gap-2 w-full py-2 hover:bg-slate-800 rounded-md px-2 cursor-pointer"><Plus />New quiz</Link>
                                <Link hidden={!user} href="/dashboard" className="flex gap-2 py-2 w-full hover:bg-slate-800 rounded-md px-2 cursor-pointer"><LayoutDashboard />Dashboard</Link>
                            </div>

                            <p className="text-gray-400 mb-2 text-sm shrink-0">Recent quizzes</p>
                            <hr className="shrink-0 border-slate-700" />

                            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto text-white gap-3 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {user ? (
                                    [...user.quizzes].reverse().map((quiz) => {
                                        const isActive = pathname === `/quiz/${quiz.id}`;

                                        return (
                                            <Link
                                                key={quiz.id}
                                                href={`/quiz/${quiz.id}`}
                                                onClick={toggleMenu}
                                                className={`flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-all group cursor-pointer border-l-4 shrink-0 ${isActive
                                                    ? 'bg-[#4ce0a3]/10 text-[#4ce0a3] border-[#4ce0a3] font-medium'
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                                                    }`}
                                            >
                                                <p className="truncate select-none">{quiz.title}</p>
                                            </Link>
                                        )
                                    })
                                ) : (
                                    localQuizzes.map((quiz) => {
                                        const isActive = activeQuizId === quiz.id;

                                        return (
                                            <button
                                                key={quiz.id}
                                                onClick={() => {
                                                    toggleMenu();
                                                    if (onOpenLocalQuiz) onOpenLocalQuiz(quiz);
                                                }}
                                                className={`flex items-center text-left w-full px-3 py-2.5 text-sm rounded-md transition-all group cursor-pointer border-l-4 shrink-0 ${isActive
                                                    ? 'bg-[#4ce0a3]/10 text-[#4ce0a3] border-[#4ce0a3] font-medium'
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                                                    }`}
                                            >
                                                <p className="truncate select-none">{quiz.title}</p>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>


                        {!user && (
                            <div className="flex flex-col items-center justify-center gap-2 shrink-0 mb-4">
                                <button onClick={toggleSignIn} hidden={!!user} className="bg-white px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-gray-300">Sign In</button>
                                <p className="text-white text-sm">Sign In to access more features</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2 mt-auto shrink-0 pb-2">
                            <div className="flex items-center gap-3">
                                <CircleUserRound className="w-8 h-8 text-white" />
                                <div className="flex flex-col text-white">
                                    <p className="font-semibold text-sm">{user?.name || 'Guest'}</p>
                                    <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase() || 'Anonymous'}</p>
                                </div>
                            </div>
                            {!!user && (
                                <button onClick={toggleLogout} className="text-red-400 hover:bg-slate-800 p-2 rounded-full transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                </aside>
            </div>

            {isSigningIn && (
                <SignupModal onClose={toggleSignIn} />
            )}

            {isLoggingOut && (
                <div onClick={toggleLogout} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center'>
                    <div onClick={(e) => e.stopPropagation()} className='z-[60] bg-white p-8 mx-4 max-w-sm w-full flex flex-col items-center gap-4 rounded-xl shadow-2xl'>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <LogOut className='w-10 h-10 text-red-500' />
                            <h2 className='text-2xl font-bold text-slate-800'>Log out?</h2>
                            <p className="text-slate-500">Are you sure you want to log out of your account?</p>
                        </div>
                        <div className='flex gap-3 w-full mt-2'>
                            <button onClick={toggleLogout} className='flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors'>Cancel</button>
                            <button className='flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg flex gap-2 justify-center items-center hover:bg-red-600 transition-colors' onClick={handleLogOut}>
                                {isPending ? <Cog className="animate-spin w-5 h-5" /> : null}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}