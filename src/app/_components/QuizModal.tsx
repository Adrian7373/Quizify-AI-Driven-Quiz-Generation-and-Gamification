"use client"

import { useState, type KeyboardEvent } from 'react';
import { useMediaQuery } from 'react-responsive';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Check, Save, SaveCheck, Trash } from 'lucide-react';
import { AppUser } from '../page';
import { saveQuiz } from '../actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

interface QuizModalProps {
    isOpen?: boolean | null;
    onClose?: () => void | null;
    quizData: QuizData | null;
    user?: AppUser | null
}

export default function QuizModal({ isOpen, onClose, quizData, user }: QuizModalProps) {
    const [includeAnswers, setIncludeAnswers] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false)

    const router = useRouter();

    const sm = useMediaQuery({ query: '(min-width: 640px)' })
    const xsm = useMediaQuery({ query: '(min-width: 500px)' })

    if (!isOpen || !quizData) return null;

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    const handleClose = () => {
        if (onClose) {
            onClose(); // If on the home page, just swap the view back
        } else {
            router.push('/'); // If on a /quiz/[id] page, route back to home
        }
    };

    const handleIdentificationAnswerSubmit = (questionIndex: number) => {
        const trimmedAnswer = (userAnswers[questionIndex] || '').trim();

        if (!trimmedAnswer) return;

        setSubmittedAnswers(prev => ({
            ...prev,
            [questionIndex]: trimmedAnswer
        }));
    };

    const handleIdentificationKeyDown = (event: KeyboardEvent<HTMLInputElement>, questionIndex: number) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleIdentificationAnswerSubmit(questionIndex);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    // ==========================================
    // 1. Text (.txt) Generator
    // ==========================================
    const generateTXT = () => {
        let content = `${quizData.title.toUpperCase()}\n\n${quizData.description}\n\n`;
        content += `=========================================\n\n`;

        quizData.questions.forEach((q, index) => {
            content += `${index + 1}. ${q.questionText}\n`;

            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
                    content += `   ${letter}) ${opt}\n`;
                });
            }

            if (includeAnswers) {
                content += `\n   [Correct Answer]: ${q.correctAnswer}\n`;
                content += `   [Explanation]: ${q.explanation}\n`;
            }
            content += `\n`;
        });

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `${quizData.title.replace(/\s+/g, '_')}.txt`);
    };

    // ==========================================
    // 2. Word (.docx) Generator
    // ==========================================
    const generateDOCX = async () => {
        const docChildren: any[] = [
            new Paragraph({
                children: [new TextRun({ text: quizData.title, bold: true, size: 32 })],
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [new TextRun({ text: quizData.description, size: 24 })],
                spacing: { after: 400 },
            }),
        ];

        quizData.questions.forEach((q, index) => {
            // Question Text
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${q.questionText}`, bold: true, size: 24 })],
                    spacing: { before: 200, after: 100 },
                })
            );

            // Options
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    docChildren.push(
                        new Paragraph({
                            children: [new TextRun({ text: `${letter}) ${opt}`, size: 24 })],
                            indent: { left: 720 }, // Indent options
                            spacing: { after: 50 },
                        })
                    );
                });
            }

            // Answers
            if (includeAnswers) {
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Correct Answer: ", bold: true, size: 24, color: "15803d" }),
                            new TextRun({ text: q.correctAnswer, size: 24, color: "15803d" }),
                        ],
                        indent: { left: 720 },
                        spacing: { before: 100 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Explanation: ", bold: true, size: 24, color: "15803d" }),
                            new TextRun({ text: q.explanation, size: 24, color: "15803d" }),
                        ],
                        indent: { left: 720 },
                        spacing: { after: 200 },
                    })
                );
            }
        });

        const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${quizData.title.replace(/\s+/g, '_')}.docx`);
    };

    // ==========================================
    // 3. PDF (.pdf) Generator
    // ==========================================
    const generatePDF = () => {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxTextWidth = pageWidth - margin * 2;
        let y = 20;

        // Helper function to handle page breaks
        const checkPageBreak = (addedHeight: number) => {
            if (y + addedHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // Title & Description
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const splitTitle = doc.splitTextToSize(quizData.title, maxTextWidth);
        doc.text(splitTitle, margin, y);
        y += splitTitle.length * 7 + 3;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const splitDesc = doc.splitTextToSize(quizData.description, maxTextWidth);
        doc.text(splitDesc, margin, y);
        y += splitDesc.length * 5 + 10;
        doc.setTextColor(0);

        // Questions Loop
        quizData.questions.forEach((q, index) => {
            checkPageBreak(20);

            doc.setFont("helvetica", "bold");
            const qText = `${index + 1}. ${q.questionText}`;
            const splitQ = doc.splitTextToSize(qText, maxTextWidth);
            doc.text(splitQ, margin, y);
            y += splitQ.length * 6;

            doc.setFont("helvetica", "normal");
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, optIndex) => {
                    checkPageBreak(10);
                    const letter = String.fromCharCode(65 + optIndex);
                    const optText = doc.splitTextToSize(`${letter}) ${opt}`, maxTextWidth - 10);
                    doc.text(optText, margin + 10, y);
                    y += optText.length * 6;
                });
            } else {
                y += 10; // Extra space for Identification answer line
            }

            if (includeAnswers) {
                checkPageBreak(20);
                doc.setTextColor(21, 128, 61); // Green color for answers
                doc.setFont("helvetica", "bold");

                const ansText = doc.splitTextToSize(`Answer: ${q.correctAnswer}`, maxTextWidth - 10);
                doc.text(ansText, margin + 10, y);
                y += ansText.length * 6;

                doc.setFont("helvetica", "normal");
                const expText = doc.splitTextToSize(`Explanation: ${q.explanation}`, maxTextWidth - 10);
                doc.text(expText, margin + 10, y);
                y += expText.length * 6;
                doc.setTextColor(0); // Reset color
            }
            y += 10; // Space between questions
        });

        doc.save(`${quizData.title.replace(/\s+/g, '_')}.pdf`);
    };

    // ==========================================
    // Master Download Handler
    // ==========================================
    const handleDownload = (format: 'pdf' | 'docx' | 'txt') => {
        setShowDownloadMenu(false); // Close dropdown

        try {
            if (format === 'txt') generateTXT();
            if (format === 'docx') generateDOCX();
            if (format === 'pdf') generatePDF();
        } catch (error) {
            console.error(`Failed to generate ${format}:`, error);
            alert(`An error occurred while generating your ${format.toUpperCase()} file.`);
        }
    };

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)

        const response = await saveQuiz(quizData, user.id)

        if (response.error) {
            toast.error("Failed to save quiz.")
        } else {
            toast.success("Quiz saved successfully!")
            setIsSaved(true);
            setIsSaving(false);
        }

    }

    return (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans overflow-hidden">
            {/* 1. TOP NAVIGATION BAR */}
            <header className="z-40 flex items-center justify-between px-3 py-4 bg-darker border-b border-slate-200 shadow-sm shrink-0">

                <div className="flex items-center gap-2 ml-4 flex-grow">
                    {/* Include Answers Toggle */}
                    <label className="flex items-center cursor-pointer gap-2 group print:hidden">
                        <span className="text-sm font-medium text-white group-hover:text-slate-900 transition-colors">
                            With Answers
                        </span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={includeAnswers}
                                onChange={() => setIncludeAnswers(!includeAnswers)}
                            />
                            <div className={`block w-11 h-6 rounded-full transition-colors ${includeAnswers ? 'bg-[#4ce0a3]' : 'bg-darker border-1 border-white'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeAnswers ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </label>

                    <div className="w-px h-6 bg-slate-200 print:hidden"></div>

                    {/* Download Dropdown */}
                    <div className="relative print:hidden">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            {sm && "Download"}
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-10">
                                <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">PDF (.pdf)</button>
                                <button onClick={() => handleDownload('docx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Word (.docx)</button>
                                <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Text (.txt)</button>
                            </div>
                        )}
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors print:hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        {xsm && "Print"}
                    </button>

                    {/* Share Button (Primary) */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-900 bg-[#4ce0a3] rounded-lg hover:bg-[#3bc48b] transition-colors print:hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        {xsm && "Share"}
                    </button>

                    {/* Save Button (Primary) */}

                    <button
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-900 bg-red-400 rounded-lg hover:bg-red-600 transition-colors print:hidden"
                    >
                        <Trash className='w-4 h-4' />

                        {sm && (isSaved ? "Deleted" : "Delete")}
                    </button>
                    {/* Close Modal (X) */}
                    <button
                        onClick={onClose}
                        className="p-2 ml-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors print:hidden"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA (Scrollable) */}
            <main className="bg-lighter flex-1 overflow-y-auto p-6 md:p-12 print:p-0 print:overflow-visible">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Print-only Header */}
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-xl text-center font-bold text-slate-800 truncate">
                            {quizData.title}
                        </h2>
                        <p className="text-sm text-center text-slate-500">{quizData.description}</p>
                    </div>

                    {/* Questions List */}
                    {quizData.questions.map((q, index) => {
                        const hasOptions = q.options && q.options.length > 0;
                        const isIdentification = !hasOptions;
                        const hasSelection = isIdentification
                            ? typeof submittedAnswers[index] === 'string' && submittedAnswers[index].trim().length > 0
                            : typeof userAnswers[index] === 'string' && userAnswers[index].trim().length > 0;
                        const isCorrect = hasSelection && (isIdentification
                            ? submittedAnswers[index] === q.correctAnswer
                            : userAnswers[index] === q.correctAnswer);
                        const showFeedback = includeAnswers || hasSelection;

                        return (
                            <div key={index} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-8 break-inside-avoid">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-sm">
                                        {index + 1}
                                    </span>
                                    <span className="mt-0.5">{q.questionText}</span>
                                </h3>

                                {/* Answer Inputs (Interactive) */}
                                <div className="mt-6 ml-10">
                                    {isIdentification ? (
                                        <div className="w-full max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Type your answer here..."
                                                value={userAnswers[index] || ''}
                                                onChange={(e) => handleAnswerSelect(index, e.target.value)}
                                                onBlur={() => handleIdentificationAnswerSubmit(index)}
                                                onKeyDown={(e) => handleIdentificationKeyDown(e, index)}
                                                className={`w-full p-3 border-b-2 bg-slate-50 focus:bg-white outline-none transition-colors text-slate-700 print:border-b print:border-black print:bg-transparent ${hasSelection ? (isCorrect ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-300 focus:border-[#4ce0a3]'}`}
                                            />
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleIdentificationAnswerSubmit(index)}
                                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                >
                                                    Check answer
                                                </button>
                                                <span className="text-xs text-slate-500">Press Enter or click check when you're done.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((option, optIdx) => {
                                                const isSelected = userAnswers[index] === option;
                                                const isCorrectAnswer = option === q.correctAnswer;
                                                const optionClass = hasSelection
                                                    ? isSelected && isCorrect
                                                        ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900'
                                                        : isSelected && !isCorrect
                                                            ? 'border-rose-500 bg-rose-50 text-slate-900'
                                                            : isCorrectAnswer
                                                                ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900'
                                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                    : isSelected
                                                        ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900'
                                                        : 'border-slate-200 hover:border-slate-300 text-slate-600';

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleAnswerSelect(index, option)}
                                                        className={`text-left p-4 rounded-lg border-2 transition-all print:border-slate-300 duration-300 ${optionClass}`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Conditional Answers Reveal (For Teachers/Reviewing) */}
                                {showFeedback && (
                                    <div className={`mt-6 ml-10 p-4 border rounded-lg print:border-black print:bg-transparent ${hasSelection ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-amber-50 border-amber-200'}`}>
                                        <p className={`text-sm font-bold ${hasSelection ? (isCorrect ? 'text-emerald-800 print:text-black' : 'text-rose-800 print:text-black') : 'text-amber-800 print:text-black'}`}>
                                            {hasSelection ? (isCorrect ? 'Correct!' : 'Not quite.') : 'Correct Answer:'} <span className="font-normal">{q.correctAnswer}</span>
                                        </p>
                                        {hasSelection && (
                                            <p className={`text-sm mt-1 ${isCorrect ? 'text-emerald-700 print:text-slate-700' : 'text-rose-700 print:text-slate-700'}`}>
                                                <span className="font-semibold">Your answer:</span> {userAnswers[index]}
                                            </p>
                                        )}
                                        <p className={`text-sm mt-1 ${hasSelection ? (isCorrect ? 'text-emerald-700 print:text-slate-700' : 'text-rose-700 print:text-slate-700') : 'text-amber-700 print:text-slate-700'}`}>
                                            <span className="font-semibold">Explanation:</span> {q.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}