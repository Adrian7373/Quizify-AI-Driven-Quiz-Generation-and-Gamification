"use client"
import { CircleUserRound, Cog, LayoutDashboard, LogOut, Menu, PanelRightClose, Plus } from "lucide-react";
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
        // FIX 1: Added z-50 here so the entire navbar sits above the button's z-30
        <div className="fixed w-full bg-darker flex py-4 items-center justify-between px-4 z-50 font-inter">
            <div className="flex gap-2 items-center">
                <Menu onClick={toggleMenu} strokeWidth={3} className="w-10 h-10 text-white cursor-pointer" />
                <Logo />
            </div>
            <button onClick={toggleSignIn} hidden={!!user} className="bg-white px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-gray-300">Sign In</button>

            {/* FIX 2: Applied conditional visibility to the backdrop */}
            <div
                onClick={toggleMenu}
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
            >
                {/* FIX 3: Applied the -translate-x-full transition to actually slide the menu */}
                <aside
                    onClick={(e) => e.stopPropagation()} // Prevents clicking the menu itself from closing it
                    className={`fixed top-0 left-0 h-full bg-darker z-50 w-72 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >

                    <div className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-10">
                            <Logo />
                            <PanelRightClose onClick={toggleMenu} className="-scale-x-100 w-6 h-6 text-white" />
                        </div>
                        <div className="text-white">
                            <div className="flex flex-col py-2 gap-2 mb-6">
                                <Link href="/" className="flex gap-2 w-full py-2 hover:bg-slate-800 rounded-md px-2 cursor-pointer"><Plus />New quiz</Link>
                                <Link href="/dashboard" className="flex gap-2 py-2 w-full hover:bg-slate-800 rounded-md px-2 cursor-pointer"><LayoutDashboard />Dashboard</Link>
                            </div>
                            <p className="text-gray-400 mb-2 text-sm">Recent quizzes</p>
                            <hr />
                            <div className="flex flex-col h-140 overflow-y-auto text-white gap-3 py-3">
                                {user ? (
                                    user.quizzes.map((quiz) => {
                                        // AUTHENTICATED CHECK: Does the URL match this quiz?
                                        const isActive = pathname === `/quiz/${quiz.id}`;

                                        return (
                                            <Link
                                                key={quiz.id}
                                                href={`/quiz/${quiz.id}`}
                                                onClick={toggleMenu}
                                                className={`flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-all group cursor-pointer border-l-4 ${isActive
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
                                        // ANONYMOUS CHECK: Does the open modal ID match this quiz?
                                        const isActive = activeQuizId === quiz.id;

                                        return (
                                            <button
                                                key={quiz.id}
                                                onClick={() => {
                                                    toggleMenu();
                                                    if (onOpenLocalQuiz) onOpenLocalQuiz(quiz);
                                                }}
                                                className={`flex items-center text-left w-full px-3 py-2.5 text-sm rounded-md transition-all group cursor-pointer border-l-4 ${isActive
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
                        {/* Account section */}
                        <div className="flex items-center justify-between px-2 mt-auto">
                            <div className="flex items-center">
                                <CircleUserRound className="w-8 h-8 text-white" />
                                <div className="flex flex-col text-white">
                                    <p>{user?.name}</p>
                                    <p>{user?.role}</p>
                                </div>
                            </div>
                            {!!user && (
                                <LogOut onClick={toggleLogout} className="text-red-400 cursor-pointer rounded-full w-8 h-8" />
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
                    <div className='z-[60] bg-white p-7 mx-8 flex flex-col items-center gap-2 rounded-md'>
                        <p className='flex text-2xl items-center pr-2'><LogOut className='w-8 h-8 pt-0.5 text-red-500' />Log out?</p>
                        <p>Are you sure you want to log out?</p>
                        <div className='flex gap-4'>
                            <button onClick={toggleLogout} className='bg-slate-200 text-black text-2xl font-semibold px-4 py-2 rounded-md'>Cancel</button>
                            <button className='bg-red-500 text-white text-2xl font-semibold px-4 py-2 rounded-md flex gap-2 items-center' onClick={handleLogOut}>{isPending && (<Cog className="animate-spin" />)}Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}