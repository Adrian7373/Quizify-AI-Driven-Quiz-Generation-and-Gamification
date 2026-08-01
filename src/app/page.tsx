"use client"
import FileDropzone from "./_components/FileDropZone";
import ImageUploadZone from "./_components/ImageUploadZone";
import { useEffect, useState } from "react";
import QuizTypeSelector from "./_components/QuestionTypeSelector";
import QuizModal from "./_components/QuizModal";

type InputOption = 'File' | 'Text' | 'Image';
export type QuizType = 'Multiple Choice' | 'True/False' | 'Identification';

// Interfaces matching your Pydantic/Prisma unified schema
export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  title: string;
  description: string;
  questions: Question[];
}

export default function Home() {

  const options: InputOption[] = ['File', 'Text', 'Image'];

  //Data state
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
  const [selectedType, setSelectedType] = useState<QuizType>("Multiple Choice")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("");
  const [debouncedText, setDebouncedText] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState("5");

  //Modal state
  const [isOpen, setIsOpen] = useState(false);

  //Generation status state
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false)

  //Progress simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      setProgress(0);
      setStatusText("Analyzing source material...");

      interval = setInterval(() => {
        setProgress((prev) => {
          // Cap the fake progress at 95% until the actual response arrives
          if (prev >= 95) return prev;

          // Update the text to make it feel like real steps are happening
          if (prev === 30) setStatusText("Structuring questions...");
          if (prev === 60) setStatusText("Validating correct answers...");
          if (prev === 85) setStatusText("Finalizing formatting...");

          // Increment by a random small amount for a natural, staggered feel
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 500); // Updates every half second
    } else {
      // Reset when generation finishes or fails
      setProgress(0);
      setStatusText("");
    }

    return () => clearInterval(interval);
  }, [isGenerating]);

  const generateQuiz = async () => {
    try {
      setIsGenerating(true);
      const formData = new FormData()

      formData.append("quizType", selectedType)
      formData.append("questionCount", questionCount)
      formData.append("inputType", selectedOption)

      if (selectedOption === "Text" && textInput) {
        formData.append("text", textInput);
      } else if (selectedOption === "File" && uploadedFile) {
        formData.append("file", uploadedFile);
      } else if (selectedOption === "Image" && uploadedImage) {
        formData.append("image", uploadedImage);
      } else {
        alert("Please provide the required input material.");
        return;
      }

      const response = await fetch("/api/quiz/generate", {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      } else {
        const generatedData = await response.json();
        setProgress(100);
        setTimeout(() => {
          setQuizData(generatedData);
          setIsOpen(true);
          setIsGenerating(false);
        }, 400);
      }

    } catch (error) {
      throw new Error("Error generating quiz" + error)
    }
  }

  const handleCloseModal = () => {
    setIsOpen(false);
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
  }

  const handleUploadImage = (file: File) => {
    if (!file) return;
    setUploadedImage(file)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  const handleUploadFile = (file: File) => {
    if (!file) return;
    setUploadedFile(file)
  }

  const handleSelectQuizType = (type: QuizType) => {
    if (!type) return;
    setSelectedType(type);
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedText(textInput)
    }, 300);
    return () => clearTimeout(debounceTimeout)
  }, [textInput])


  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-dark py-2 px-6 flex flex-col items-center">
        <div className="py-12 text-white font-inter">
          <h1 className="text-4xl text-center">Turn Any Text Into an Assessment in Seconds</h1>
          <p className="text-lg text-center">Paste your source material, and Quizify instantly generates accurate, gamified multiple-choice questions.</p>
        </div>
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
        <div hidden={selectedOption !== "File"} className="py-4">
          <FileDropzone handleRemoveFile={handleRemoveFile} file={uploadedFile} handleUploadFile={handleUploadFile} />
        </div>
        <div hidden={selectedOption !== "Text"} className="py-4">
          <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Enter text here..." className="w-84 h-54 border-1 border-white rounded-md focus:outline-none p-2 text-white"></textarea>
        </div>
        <div hidden={selectedOption !== "Image"} className="py-4">
          <ImageUploadZone image={uploadedImage} handleUploadImage={handleUploadImage} handleRemoveImage={handleRemoveImage} />
        </div>
        <QuizTypeSelector quizType={selectedType} handleTypeChange={handleSelectQuizType} />
        {/* Number of Questions */}
        <label className="py-4 flex items-center gap-2 font-inter text-white">Number of Questions:
          <select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="focus:outline-none border-1 border-white px-4 py-2 rounded-lg">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="25">25</option>
            <option value="30">30</option>
            <option value="35">35</option>
            <option value="40">40</option>
          </select>
        </label>
        {/* Generate Button */}
        <button
          onClick={generateQuiz}
          disabled={isGenerating}
          className={`
            relative flex items-center justify-center gap-3 py-4 w-full rounded-lg text-lg font-semibold transition-colors mt-2
            ${isGenerating
              ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
              : 'bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900'
            }
          `}
        >
          {isGenerating && (
            <svg
              className="animate-spin h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          )}
          {isGenerating ? 'Generating...' : 'Generate Questions'}
        </button>
      </section>
      {quizData && isOpen && (
        <QuizModal quizData={quizData} onClose={handleCloseModal} isOpen={isOpen} />

      )}

      {/* Loading Progress UI */}
      {isGenerating && (
        <div className="w-full mt-6 mb-2 font-inter">
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>{statusText}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#4ce0a3] h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}