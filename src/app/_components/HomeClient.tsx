"use client"
import FileDropzone from "./FileDropZone";
import ImageUploadZone from "./ImageUploadZone";
import { useEffect, useState } from "react";
import QuizTypeSelector from "./QuestionTypeSelector";
import QuizModal from "./QuizModal";
import NavBar from "./NavBar";
import handleAnonymousGeneration from "../actions/generate";
import fpPromise from '@fingerprintjs/fingerprintjs'
import SignupModal from "./SignUpModal";
import { handleAuthenticatedGeneration } from "../actions/generate";
import type { AppUser, InputOption, QuizData, QuizType, DifficultyType } from "../page";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface HomeClientProps {
  initialUser: AppUser | null;
}

export default function HomeClient({ initialUser }: HomeClientProps) {

  const MAX_FILE_SIZE_MB = 10;
  const MAX_IMAGE_SIZE_MB = 5;


  const options: InputOption[] = ['File', 'Text', 'Image'];
  const [user, setUser] = useState<AppUser | null>(initialUser);
  const router = useRouter(); // Initialize router

  //Data state
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
  const [selectedType, setSelectedType] = useState<QuizType>("MULTIPLE_CHOICE")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState("5");
  const [isNoCredits, setIsNoCredits] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyType>("normal");
  const [language, setLanguage] = useState("English");

  //Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isLimit, setIsLimit] = useState(false);

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
      formData.append("difficulty", difficulty)
      formData.append("language", language);

      if (selectedOption === "Text" && textInput) {
        formData.append("text", textInput);
      } else if (selectedOption === "File" && uploadedFile) {
        formData.append("file", uploadedFile);
      } else if (selectedOption === "Image" && uploadedImage) {
        formData.append("image", uploadedImage);
      } else {
        alert("Please provide the required input material.");
        setIsGenerating(false);
        return;
      }

      const fp = await fpPromise.load()
      const result = await fp.get()
      const visitorId = result.visitorId

      if (user) {

        const response = await handleAuthenticatedGeneration(formData, user.id)
        console.log(response)

        if (response.error) {
          if (response.reason === "credits") {
            setIsNoCredits(true);
            setIsGenerating(false);
          } else {
            alert("Failed to generate quiz. Server error")
          }

        } else {

          const generatedData = await response.quizData;
          setProgress(100);
          setTimeout(() => {
            setQuizData(generatedData);
            setIsOpen(true);
            setIsGenerating(false);
            router.push(`/quiz/${generatedData.id}`);
          }, 400);
        }

      } else {

        const response = await handleAnonymousGeneration(formData, visitorId);

        if (response.error) {
          if (response.reason === "limit") {
            setIsLimit(true);
          } else {
            alert("Failed to generate quiz. Server error")
          }

        } else {

          const generatedData = await response.quizData;

          // Give it a unique fake ID so we can map it in the sidebar
          const quizWithId = { ...generatedData, id: crypto.randomUUID() };

          const existingStr = localStorage.getItem('anon_quizzes');
          const existing = existingStr ? JSON.parse(existingStr) : [];

          // Save the new quiz at the top of the array
          localStorage.setItem('anon_quizzes', JSON.stringify([quizWithId, ...existing]));

          setProgress(100);
          setTimeout(() => {
            setQuizData(quizWithId);
            setIsOpen(true);
            setIsGenerating(false);
          }, 400);
        }
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

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      toast.error(`Image is too large! Please keep it under ${MAX_IMAGE_SIZE_MB}MB.`);
      return; // Reject the image
    }

    setUploadedImage(file); // Accept the image
  };

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  const handleUploadFile = (file: File) => {
    if (!file) return;

    // Convert bytes to MB
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File is too large! Please keep it under ${MAX_FILE_SIZE_MB}MB.`);
      return; // Reject the file
    }

    setUploadedFile(file); // Accept the file
  };

  const handleSelectQuizType = (type: QuizType) => {
    if (!type) return;
    setSelectedType(type);
  }

  const hideModal = () => {
    setIsLimit(false);
  }

  const handleOpenLocalQuiz = (localQuiz: QuizData) => {
    setQuizData(localQuiz);
    setIsOpen(true);
  }

  return (
    <>
      <NavBar user={user} onOpenLocalQuiz={handleOpenLocalQuiz} activeQuizId={quizData?.id} />
      {isLimit && (
        <SignupModal onClose={hideModal} />
      )}
      <div className="pt-20 bg-dark h-dvh flex flex-col box-border">

        {/* VIEW SWAPPER: If quiz is open, show quiz. Otherwise, show generator. */}
        {quizData && isOpen ? (
          <QuizModal quizData={quizData} onClose={handleCloseModal} isOpen={isOpen} user={user} />
        ) : (
          <section className="py-2 px-6 flex flex-col items-center flex-1 overflow-y-auto">
            <div className="py-7 text-white font-inter flex flex-col gap-2">
              <h1 className="text-2xl text-center">Turn Any Text Into an Assessment in Seconds</h1>
              <p className="text-md text-center">Paste your source material, and Quizify instantly generates accurate, gamified multiple-choice questions.</p>
            </div>
            {/* The Segmented Control Container */}
            <div className="flex shrink-0 w-full max-w-sm rounded-full border border-slate-300 overflow-hidden bg-white font-inter">
              {options.map((option, index) => {
                const isActive = selectedOption === option;

                return (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className={`
                flex-1 py-2 px-4 text-sm font-semibold transition-colors duration-300
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

            <div className="mb-3">
              <div>
                <div hidden={selectedOption !== "File"} className="pt-4 w-full">
                  <FileDropzone handleRemoveFile={handleRemoveFile} file={uploadedFile} handleUploadFile={handleUploadFile} />
                </div>
                <div hidden={selectedOption !== "Text"} className="pt-4 w-full">
                  <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Enter text here..." className="w-full h-54 border-1 border-white rounded-t-md focus:outline-none p-2 text-white"></textarea>
                </div>
                <div hidden={selectedOption !== "Image"} className="pt-4">
                  <ImageUploadZone image={uploadedImage} handleUploadImage={handleUploadImage} handleRemoveImage={handleRemoveImage} />
                </div>
              </div>
              <div className="flex gap-1 border-1 rounded-b-md border-white px-2">
                {/* Number of Questions */}
                <label className="flex items-center gap-2 font-inter text-white text-sm"># of Questions:
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

                {/* Difficulty selector*/}
                <label className="flex items-center gap-2 font-inter text-white text-sm">Difficulty:
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyType)} className="focus:outline-none border-1 border-white px-4 py-2 rounded-lg">
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="w-full max-w-sm mb-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Quiz Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] transition-colors text-slate-700 font-medium bg-white"
              >
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
                <option value="Taglish (Tagalog-English)">Taglish</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Japanese">Japanese</option>
                {/* Add any other languages you want to support */}
              </select>
            </div>

            <QuizTypeSelector quizType={selectedType} handleTypeChange={handleSelectQuizType} />

            {/* Loading Progress UI */}
            {isGenerating && (
              <div className="w-full mt-6 mb-2 font-inter bg-dark">
                <div className="flex justify-between text-sm text-slate-300 mb-2">
                  <span>{statusText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full px-5 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#4ce0a3] h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateQuiz}
              disabled={isGenerating || (user ? user.aiCredits <= 0 : false)}
              className={`
            relative flex disabled:bg-slate-600 z-30 max-w-md disabled:text-slate-300 disabled:cursor-not-allowed items-center justify-center gap-3 py-4 w-full rounded-lg text-lg font-semibold transition-colors mt-5
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
              {isGenerating
                ? 'Generating...'
                : user && user.aiCredits <= 0
                  ? 'Daily limit reached. Please try again later'
                  : 'Generate Questions'}
            </button>


          </section>
        )}
        {/* Hero Section */}
      </div>
    </>
  )
}