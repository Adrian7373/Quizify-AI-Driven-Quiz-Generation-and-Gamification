"use client"
import NavBar from "./_components/NavBar";
import { useState } from "react";

type InputOption = 'File' | 'Text' | 'Image';

export default function Home() {

  const [selectedOption, setSelectedOption] = useState<InputOption>('Text');

  const options: InputOption[] = ['File', 'Text', 'Image'];

  return (
    <div>
      <NavBar />
      {/* Hero Section */}
      <section className="bg-dark py-2 px-6 flex flex-col items-center">
        <div className="py-12 text-white">
          <h1 className="text-4xl text-center">Turn Any Text Into an Assessment in Seconds</h1>
          <p className="text-lg text-center">Paste your source material, and Quizmatic’s AI instantly generates accurate, gamified multiple-choice questions. Stop writing trivia by hand.</p>
        </div>
        {/* The Segmented Control Container */}
        <div className="flex w-full max-w-sm rounded-full border border-slate-300 overflow-hidden bg-white">
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
      </section>
    </div>
  )
}