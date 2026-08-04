"use client"
import { CircleUserRound, Menu, PanelRightClose, Plus } from "lucide-react";
import Logo from "./Logo";
import { useState } from "react";
import { AppUser } from "../page";
import SignupModal from "./SignUpModal";
import Link from "next/link";

interface NavBarProps {
    user: AppUser | null
}

export default function NavBar({ user }: NavBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const toggleMenu = () => {
        setIsOpen((prev) => !prev)
    }

    const toggleSignIn = () => {
        setIsSigningIn((prev) => !prev)
    }

    return (
        // FIX 1: Added z-50 here so the entire navbar sits above the button's z-30
        <div className="fixed w-full bg-darker flex py-4 items-center justify-between px-4 z-50">
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
                            <Link href="/" className="flex gap-2 w-full py-2 mb-4 hover:bg-slate-800 rounded-md px-2 cursor-pointer"><Plus />New quiz</Link>
                            <p className="text-gray-400 mb-2">Recent quizzes</p>
                            <hr />
                            <div className="flex flex-col h-80 overflow-y-auto text-white gap-3 py-3">
                                {user?.quizzes.map((quiz) => (
                                    <Link
                                        key={quiz.id}
                                        href={`/quiz/${quiz.id}`}
                                        onClick={toggleMenu} // Automatically slide the menu closed when they click a quiz
                                        className="flex items-center w-full px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors group cursor-pointer"
                                    >
                                        <p className="truncate select-none">{quiz.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {/* Account section */}
                        <div className="flex items-center gap-2 mt-auto">
                            <CircleUserRound className="w-8 h-8 text-white" />
                            <div className="flex flex-col text-white">
                                <p>{user?.name}</p>
                                <p>{user?.role}</p>
                            </div>
                        </div>
                    </div>



                </aside>
            </div>
            {isSigningIn && (
                <SignupModal onClose={toggleSignIn} />
            )}
        </div>
    )
}