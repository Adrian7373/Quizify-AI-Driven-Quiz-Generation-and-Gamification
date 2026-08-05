"use client"
import { useState } from "react";
import { QuizType } from "../page";

interface QuestionTypeSelector {
    quizType: QuizType,
    handleTypeChange: (quizType: QuizType) => void
}

export default function QuizTypeSelector({ quizType, handleTypeChange }: QuestionTypeSelector) {
    const options: QuizType[] = ['Multiple Choice', 'True/False', 'Identification'];

    return (
        <>
            {/* The Segmented Control Container */}
            <div className="flex shrink-0 w-full max-w-sm rounded-full border border-slate-300 overflow-hidden bg-white font-inter">
                {options.map((option, index) => {
                    const isActive = quizType === option;

                    return (
                        <button
                            key={option}
                            onClick={() => handleTypeChange(option)}
                            className={`
                flex-1 py-2 px-4 text-sm font-semibold transition-colors
                ${index !== options.length - 1 ? 'border-r border-slate-300' : ''}
                ${isActive
                                    ? 'bg-[#4ce0a3]' // Matches the mint green from the image
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                }
              `}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </>
    )
}