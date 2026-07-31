"use client"

import { CloudUpload } from 'lucide-react';
import { useState, useRef } from 'react';

export default function FileDropzone() {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Drag and Drop Event Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    // Button Click Handler
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the hidden input
        }
    };

    if (selectedFile) {
        return (
            <div className="flex items-center justify-between w-full p-4 border rounded-xl bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3 overflow-hidden max-w-54">
                    {/* Document Icon */}
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-brand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>

                    {/* File Name */}
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {selectedFile.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Checkmark Icon */}
                    <svg className="text-green-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>

                    {/* Remove Button (X) */}
                    <button
                        onClick={clearFile}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove file"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
        flex flex-col items-center justify-center w-full px-6 py-10
        border-2 border-dashed rounded-2xl transition-colors
        ${isDragging
                    ? 'border-brand bg-brand/5'
                    : 'border-slate-300 bg-white'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <CloudUpload className='w-10 h-10' />

            {/* Main Text */}
            <h3 className="text-sm font-semibold text-slate-700">
                Choose a file or drag & drop it here
            </h3>

            {/* Sub Text */}
            <p className="mt-1.5 text-xs text-slate-400">
                PDF, TXT and DOCX formats, up to 5MB
            </p>

            {/* Browse Button */}
            <button
                type="button"
                onClick={handleBrowseClick}
                className="mt-5 px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
            >
                Browse File
            </button>

            {/* Hidden Native File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".jpeg,.jpg,.png,.pdf,.mp4"
            />
        </div>
    );
}