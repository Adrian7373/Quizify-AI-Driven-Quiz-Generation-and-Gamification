"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/app/_components/FileDropZone";
import ImageUploadZone from "@/app/_components/ImageUploadZone";
import QuizTypeSelector from "@/app/_components/QuestionTypeSelector";
import { handleAuthenticatedGeneration } from "@/app/actions/generate";
import type { InputOption, QuizType, DifficultyType } from "@/app/page";

interface GenerateQuizModalProps {
    onClose: () => void;
    userId: string;
}

export default function GenerateQuizModal({ onClose, userId }: GenerateQuizModalProps) {
    const router = useRouter();

    // Data State (Directly from your HomeClient)
    const options: InputOption[] = ['Text', 'File', 'Image'];
    const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
    const [selectedType, setSelectedType] = useState<QuizType>("MULTIPLE_CHOICE");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState("");
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [questionCount, setQuestionCount] = useState("5");
    const [difficulty, setDifficulty] = useState<DifficultyType>("normal");
    const [language, setLanguage] = useState("English");

    // Generation status state
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Progress simulator (Directly from your HomeClient)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isGenerating) {
            setProgress(0);
            setStatusText("Analyzing source material...");

            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) return prev;
                    if (prev === 30) setStatusText("Structuring questions...");
                    if (prev === 60) setStatusText("Validating correct answers...");
                    if (prev === 85) setStatusText("Finalizing formatting...");
                    return prev + Math.floor(Math.random() * 5) + 1;
                });
            }, 500);
        } else {
            setProgress(0);
            setStatusText("");
        }

        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation
        if (selectedOption === "Text" && !textInput.trim()) return toast.error("Please enter some text.");
        if (selectedOption === "File" && !uploadedFile) return toast.error("Please upload a file.");
        if (selectedOption === "Image" && !uploadedImage) return toast.error("Please upload an image.");

        if (selectedOption === "File" && uploadedFile) {
            if (uploadedFile.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
                return toast.error(`File exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
            }
        }

        if (selectedOption === "Image" && uploadedImage) {
            if (uploadedImage.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
                return toast.error(`Image exceeds the ${MAX_IMAGE_SIZE_MB}MB limit.`);
            }
        }

        try {
            setIsGenerating(true);
            const formData = new FormData();

            formData.append("quizType", selectedType);
            formData.append("questionCount", questionCount);
            formData.append("inputType", selectedOption);
            formData.append("difficulty", difficulty);
            formData.append("language", language);

            if (selectedOption === "Text") formData.append("text", textInput);
            if (selectedOption === "File") formData.append("file", uploadedFile!);
            if (selectedOption === "Image") formData.append("image", uploadedImage!);

            // Call your authenticated server action
            const response = await handleAuthenticatedGeneration(formData, userId);

            if (response.error) {
                if (response.reason === "credits") {
                    toast.error("You are out of AI credits!");
                } else {
                    toast.error("Failed to generate quiz. Server error.");
                }
                setIsGenerating(false);
            } else {
                const generatedData = await response.quizData;
                setProgress(100);
                setStatusText("Quiz Ready!");

                setTimeout(() => {
                    toast.success("Quiz generated successfully!");
                    setIsGenerating(false);
                    onClose();
                    router.push(`/quiz/${generatedData.id}`);
                }, 400);
            }

        } catch (error) {
            console.error("Error generating quiz:", error);
            toast.error("An unexpected error occurred.");
            setIsGenerating(false);
        }
    };

    const MAX_FILE_SIZE_MB = 10;
    const MAX_IMAGE_SIZE_MB = 5;

    // Upload Handlers

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

    const handleUploadImage = (file: File) => {
        if (!file) return;

        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
            toast.error(`Image is too large! Please keep it under ${MAX_IMAGE_SIZE_MB}MB.`);
            return; // Reject the image
        }

        setUploadedImage(file); // Accept the image
    };

    const handleRemoveFile = () => setUploadedFile(null);
    const handleRemoveImage = () => setUploadedImage(null);
    const handleSelectQuizType = (type: QuizType) => type && setSelectedType(type);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                className="bg-slate-50 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 bg-white border-b border-slate-100 shrink-0">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-[#4ce0a3] w-6 h-6" />
                        Generate Assessment
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-6">

                    {/* Input Type Segmented Control */}
                    <div className="flex w-full rounded-xl border-2 border-slate-200 overflow-hidden bg-white font-inter shadow-sm p-1 gap-1">
                        {options.map((option) => {
                            const isActive = selectedOption === option;
                            return (
                                <button
                                    key={option}
                                    onClick={() => setSelectedOption(option)}
                                    disabled={isGenerating}
                                    className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${isActive
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                        }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamic Input Zone */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm min-h-[160px]">
                        {selectedOption === "File" && (
                            <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 z-10">Max {MAX_FILE_SIZE_MB}MB</span>
                        )}
                        {selectedOption === "Image" && (
                            <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 z-10">Max {MAX_IMAGE_SIZE_MB}MB</span>
                        )}
                        <div hidden={selectedOption !== "File"} className="w-full h-full">
                            <FileDropzone handleRemoveFile={handleRemoveFile} file={uploadedFile} handleUploadFile={handleUploadFile} />
                        </div>
                        <div hidden={selectedOption !== "Text"} className="w-full h-full">
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Paste your source material here..."
                                className="w-full h-40 border-none focus:ring-0 outline-none p-4 text-slate-700 font-medium resize-none bg-transparent placeholder:text-slate-300"
                            />
                        </div>
                        <div hidden={selectedOption !== "Image"} className="w-full h-full">
                            <ImageUploadZone image={uploadedImage} handleUploadImage={handleUploadImage} handleRemoveImage={handleRemoveImage} />
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-700">Quiz Settings</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Question Count */}
                            <label className="flex flex-col gap-2 font-inter text-slate-600 text-sm font-bold">
                                Number of Questions
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(e.target.value)}
                                    className="focus:outline-none focus:border-[#4ce0a3] border-2 border-slate-200 px-4 py-2.5 rounded-lg bg-slate-50 transition-colors"
                                >
                                    {[5, 10, 15, 20, 25, 30, 35, 40].map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </label>

                            {/* Difficulty */}
                            <label className="flex flex-col gap-2 font-inter text-slate-600 text-sm font-bold">
                                Difficulty Level
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                                    className="focus:outline-none focus:border-[#4ce0a3] border-2 border-slate-200 px-4 py-2.5 rounded-lg bg-slate-50 transition-colors capitalize"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="normal">Normal</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </label>

                            {/* Language */}
                            <label className="flex flex-col gap-2 font-inter text-slate-600 text-sm font-bold md:col-span-2">
                                Quiz Language
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="focus:outline-none focus:border-[#4ce0a3] border-2 border-slate-200 px-4 py-2.5 rounded-lg bg-slate-50 transition-colors"
                                >
                                    <option value="English">English</option>
                                    <option value="Filipino">Filipino</option>
                                    <option value="Taglish (Tagalog-English)">Taglish</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="Japanese">Japanese</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <QuizTypeSelector quizType={selectedType} handleTypeChange={handleSelectQuizType} />
                    </div>

                </div>

                {/* Footer / Generate Action */}
                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                    {/* Loading Progress UI */}
                    {isGenerating && (
                        <div className="w-full mb-4 font-inter animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                                <div
                                    className="bg-[#4ce0a3] h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(76,224,163,0.5)]"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`
                            relative flex items-center justify-center gap-3 py-4 w-full rounded-xl text-lg font-black transition-all shadow-lg active:scale-95
                            ${isGenerating
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100'
                                : 'bg-[#4ce0a3] hover:bg-[#3bc48b] text-slate-900 shadow-[#4ce0a3]/20'
                            }
                        `}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                Generate Quiz
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}