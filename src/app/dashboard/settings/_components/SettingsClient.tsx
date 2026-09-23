"use client"

import { useState } from "react";
import { User, Shield, Bell, Sparkles, LogOut, Save, Cog } from "lucide-react";
import { AppUser } from "@/app/page";
import { logOutUser, updateAccountProfile } from "../actions";
import toast from "react-hot-toast";
import { error } from "node:console";
import { useRouter } from "next/navigation";

export type Tab = "account" | "preferences" | "security" | "credits";
type Role = "TEACHER" | "STUDENT";

interface SettingsClientProps {
    user: AppUser;
    initialTab: Tab;
}

export default function SettingsClient({ user, initialTab }: SettingsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? "account");
    const [isSaving, setIsSaving] = useState(false);

    // Loading state of logout
    const [isPending, setIsPending] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Form states for the Account tab
    const [name, setName] = useState(user.name || "");
    const [role, setRole] = useState<Role>(user.role as Role || "TEACHER");

    const hasChanges = name !== (user.name || "") || role !== user.role;

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

    const handleAccountSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await updateAccountProfile(user.id, name, role);

            if (response?.error) {
                toast.error(response.error)
            } else {
                toast.success(response.message)
            }
        }
        finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: "account", label: "Account Profile", icon: User },
        { id: "preferences", label: "Preferences", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        { id: "credits", label: "AI Credits", icon: Sparkles },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Sidebar Navigation */}
            <nav className="w-full md:w-64 shrink-0 flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${isActive
                                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            {/* Content Area */}
            <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-[500px]">

                {/* --- ACCOUNT TAB --- */}
                {activeTab === "account" && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Account Profile</h2>

                        <form onSubmit={handleAccountSave} className="space-y-6 max-w-xl">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full p-3 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-400 mt-2">Email addresses are tied to your authentication provider and cannot be changed here.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Account Role</label>
                                <div className="flex border-2 border-slate-200 items-center rounded-lg overflow-hidden max-w-[240px]">
                                    <button
                                        type="button"
                                        onClick={() => setRole("TEACHER")}
                                        className={`flex-1 px-3 py-2.5 text-sm font-bold transition-colors ${role === "TEACHER"
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "bg-transparent text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        Teacher
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("STUDENT")}
                                        className={`flex-1 px-3 py-2.5 text-sm font-bold transition-colors border-l-2 border-slate-200 ${role === "STUDENT"
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "bg-transparent text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        Student
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Teachers can assign quizzes and host live games. Students can use quizzes for flashcards and practice.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={isSaving || !hasChanges}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed duration:500"
                                >
                                    <Save className="w-5 h-5" />
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- PREFERENCES TAB --- */}
                {activeTab === "preferences" && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Preferences</h2>
                        <div className="space-y-6 max-w-xl">
                            <div className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl">
                                <div>
                                    <p className="font-bold text-slate-800">Email Notifications</p>
                                    <p className="text-sm text-slate-500">Receive reports when assignments end.</p>
                                </div>
                                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200 cursor-pointer">
                                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SECURITY TAB --- */}
                {activeTab === "security" && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Security</h2>
                        <div className="space-y-4 max-w-xl">
                            <button className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-slate-300 transition-colors text-left">
                                <div>
                                    <p className="font-bold text-slate-800">Change Password</p>
                                    <p className="text-sm text-slate-500">Update your account password</p>
                                </div>
                                <span className="text-indigo-600 font-semibold text-sm">Update</span>
                            </button>

                            <button onClick={toggleLogout} className="w-full flex items-center justify-between p-4 border-2 border-rose-100 bg-rose-50 rounded-xl hover:border-rose-200 transition-colors text-left group cursor-pointer">
                                <div>
                                    <p className="font-bold text-rose-800">Sign Out</p>
                                    <p className="text-sm text-rose-600/80">Log out of this device</p>
                                </div>
                                <LogOut className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- CREDITS TAB --- */}
                {activeTab === "credits" && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">AI Credits</h2>

                        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white max-w-xl relative overflow-hidden mb-8">
                            <Sparkles className="absolute right-[-20px] top-[-20px] w-32 h-32 text-white/5 rotate-12" />
                            <p className="text-slate-400 font-bold tracking-wider text-xs uppercase mb-1">Current Balance</p>
                            <p className="text-5xl font-black text-[#4ce0a3] mb-4">{user.aiCredits}</p>
                            <p className="text-sm text-slate-300">Generating a 10-question quiz costs 1 credit. Free tier credits replenish monthly.</p>
                        </div>

                        <h3 className="font-bold text-slate-800 mb-4">Top Up Credits</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                            <div className="border-2 border-slate-200 rounded-xl p-5 hover:border-indigo-400 transition-colors cursor-pointer text-center">
                                <p className="text-2xl font-black text-slate-800 mb-1">100</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Credits</p>
                                <button className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-sm">₱150.00</button>
                            </div>
                            <div className="border-2 border-indigo-500 rounded-xl p-5 bg-indigo-50 cursor-pointer text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-bl-lg">Best Value</div>
                                <p className="text-2xl font-black text-slate-800 mb-1">500</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Credits</p>
                                <button className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm">₱500.00</button>
                            </div>
                        </div>
                    </div>
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
        </div>
    );
}