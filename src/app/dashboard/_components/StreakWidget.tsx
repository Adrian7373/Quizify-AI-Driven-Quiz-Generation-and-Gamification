"use client"
import { Flame, Check, Gift } from "lucide-react";

export default function StreakWidget({ streak }: { streak: number }) {
    // Calculate progress towards the 7-day bonus
    // If streak is 8, progress is 1. If streak is 7, progress is 7.
    const progressInWeek = streak === 0 ? 0 : ((streak - 1) % 7) + 1;
    const days = [1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8 mt-28 w-full max-w-3xl">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                        {streak} Day Streak!
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                        {7 - progressInWeek} days until your +5 credit bonus
                    </p>
                </div>
            </div>

            {/* The Visual Journey */}
            <div className="flex justify-between items-center relative z-10">
                {/* Background Track Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full -z-10"></div>

                {/* Active Progress Line */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-orange-400 rounded-full -z-10 transition-all duration-500 ease-out"
                    style={{ width: `${((progressInWeek - 1) / 6) * 100}%` }}
                ></div>

                {days.map((day) => {
                    const isCompleted = day <= progressInWeek;
                    const isToday = day === progressInWeek;
                    const isBonusDay = day === 7;

                    return (
                        <div key={day} className="flex flex-col items-center gap-2">
                            <div className={`
                                w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${isCompleted && !isBonusDay ? 'bg-orange-400 border-orange-400 text-white' : ''}
                                ${isCompleted && isBonusDay ? 'bg-[#4ce0a3] border-[#4ce0a3] text-white' : ''}
                                ${!isCompleted ? 'bg-white border-slate-200 text-slate-300' : ''}
                                ${isToday ? 'ring-4 ring-orange-100 scale-110' : ''}
                            `}>
                                {isCompleted ? (
                                    isBonusDay ? <Gift className="w-4 h-4 md:w-5 md:h-5" /> : <Check className="w-4 h-4 md:w-5 md:h-5" />
                                ) : (
                                    isBonusDay ? <Gift className="w-4 h-4 md:w-5 md:h-5" /> : <span className="font-bold text-xs md:text-sm">{day}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}