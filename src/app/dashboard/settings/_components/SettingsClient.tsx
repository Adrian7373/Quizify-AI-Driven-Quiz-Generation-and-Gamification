"use client"

import { useState } from "react";
import { User, Shield, Bell, Sparkles, LogOut, Save } from "lucide-react";

type Tab = "account" | "preferences" | "security" | "credits";

interface SettingsClientProps {
    user: any; // Ideally typed to your Prisma User model
}

export default function SettingsClient({ user }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>("account");
    const [isSaving, setIsSaving] = useState(false);

    // Form states for the Account tab
    const [name, setName] = useState(user.name || "");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // TODO: Call a Server Action here to update the user in Prisma
        setTimeout(() => setIsSaving(false), 1000);
    };

    const tabs = [
        { id: "account", label: "Account Profile", icon: User },
        { id: "preferences", label: "Preferences", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        ...(user.role === "TEACHER" ? [{ id: "credits", label: "AI Credits", icon: Sparkles }] : []),
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

                        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
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
                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${user.role === "TEACHER" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {user.role}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-70">
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

                            <button className="w-full flex items-center justify-between p-4 border-2 border-rose-100 bg-rose-50 rounded-xl hover:border-rose-200 transition-colors text-left group">
                                <div>
                                    <p className="font-bold text-rose-800">Sign Out</p>
                                    <p className="text-sm text-rose-600/80">Log out of this device</p>
                                </div>
                                <LogOut className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- CREDITS TAB (Teachers Only) --- */}
                {activeTab === "credits" && user.role === "TEACHER" && (
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

            </div>
        </div>
    );
}