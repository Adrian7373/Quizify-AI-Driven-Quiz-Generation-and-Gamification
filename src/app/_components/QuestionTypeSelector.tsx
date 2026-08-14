"use client"
import { QuizType } from "../page";

interface QuestionTypeSelector {
    quizType: QuizType,
    handleTypeChange: (quizType: QuizType) => void
}

// 1. Map programmatic enums to human-readable labels
const TYPE_LABELS: Record<QuizType, string> = {
    MULTIPLE_CHOICE: "Multiple Choice",
    TRUE_FALSE: "True / False",
    IDENTIFICATION: "Identification",
    ESSAY: "Essay"
};

export default function QuizTypeSelector({ quizType, handleTypeChange }: QuestionTypeSelector) {
    const options: QuizType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'IDENTIFICATION', 'ESSAY'];

    return (
        <div className="w-full flex flex-col gap-2 font-inter shrink-0">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Question Type
            </label>

            {/* 2. Responsive Grid Container: 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 shadow-sm">
                {options.map((option) => {
                    const isActive = quizType === option;

                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleTypeChange(option)}
                            className={`
                                py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all text-center flex items-center justify-center
                                ${isActive
                                    ? 'bg-[#4ce0a3] text-slate-900 shadow-md'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                }
                            `}
                        >
                            {/* Render the mapped label instead of the raw option */}
                            {TYPE_LABELS[option]}
                        </button>
                    );
                })}
            </div>
        </div>
    )
}