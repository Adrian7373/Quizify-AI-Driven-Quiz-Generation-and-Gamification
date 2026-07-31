"use client"
import { useState } from "react";

type InputOption = 'Multiple Choice' | 'True/False' | 'Identification';

export default function QuestionTypeSelector() {

    const [selectedOption, setSelectedOption] = useState<InputOption>('Multiple Choice');

    const options: InputOption[] = ['Multiple Choice', 'True/False', 'Identification'];

    return (
        <>
            {/* The Segmented Control Container */}
            <div className="flex w-full max-w-sm rounded-full border border-slate-300 overflow-hidden bg-white font-inter">
                {options.map((option, index) => {
                    const isActive = selectedOption === option;

                    return (
                        <button
                            key={option}
                            onClick={() => setSelectedOption(option)}
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