"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signUp } from "../signup/actions";
import { signInWithProvider } from "../login/actions";

export default function SignupModal() {
    const [isShowing, setIsShowing] = useState(false);

    const handleToggleShow = () => {
        setIsShowing((prev) => !prev);
    };

    return (
        <div className="bg-black/50 z-50 fixed inset-0 flex justify-center items-center w-full min-h-dvh">
            <div className="bg-dark p-10 flex flex-col justify-center w-full shadow-md mx-6 max-w-[500px] rounded-lg">
                <h1 className="text-center text-white text-xl font-semibold mb-6">
                    Sign Up to continue
                </h1>

                {/* 1. EMAIL & PASSWORD SIGNUP FORM */}
                <form action={signUp} className="text-white flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        Name:
                        <input
                            name="name"
                            type="text"
                            className="border-white border py-2 rounded-md focus:outline-none px-2 bg-transparent text-white"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        Email:
                        <input
                            name="email"
                            type="email"
                            className="border-white border py-2 rounded-md focus:outline-none px-2 bg-transparent text-white"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        Password:
                        <div className="flex items-center border border-white rounded-md">
                            <input
                                name="password"
                                type={isShowing ? "text" : "password"}
                                className="border-r border-white py-2 focus:outline-none px-2 flex-grow bg-transparent text-white"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={handleToggleShow}
                                className="px-2 text-white focus:outline-none"
                            >
                                {isShowing ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </label>

                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors mt-4"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-300">
                    Already have an account?{" "}
                    <Link href="/login" className="text-mint underline hover:text-white transition-colors">
                        Sign In
                    </Link>
                </div>

                {/* DIVIDER */}
                <div className="flex items-center py-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-white text-sm">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* 2. SOCIAL OAUTH FORM */}
                <form action={signInWithProvider} className="flex flex-col items-center gap-3">
                    <button
                        type="submit"
                        name="provider"
                        value="facebook"
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <FaFacebook color="#1877F2" className="text-xl" />
                        Sign up with Facebook
                    </button>

                    <button
                        type="submit"
                        name="provider"
                        value="google"
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <FcGoogle className="text-xl" />
                        Sign up with Google
                    </button>
                </form>
            </div>
        </div>
    );
}