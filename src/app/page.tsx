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

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
  const [selectedType, setSelectedType] = useState<QuizType>("Multiple Choice")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("");
  const [debouncedText, setDebouncedText] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState("5");
  const [isOpen, setIsOpen] = useState(false);

  const generateQuiz = async () => {
    try {
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
        setQuizData(await response.json())
        setIsOpen(true)
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
        <button onClick={generateQuiz} className="bg-mint py-4 w-full rounded-lg text-lg font-semibold">Generate Questions</button>
      </section>
      {quizData && isOpen && (
        <QuizModal quizData={quizData} onClose={handleCloseModal} isOpen={isOpen} />

      )}
    </div>
  )
}