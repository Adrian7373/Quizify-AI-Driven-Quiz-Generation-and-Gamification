export default function GeneratorSkeleton() {
    return (
        <div className="flex flex-col items-center w-full max-w-sm lg:max-w-md xl:w-lg animate-pulse mt-4 lg:mt-22 lg:mt-0">

            {/* 1. Segmented Control (File | Text | Image) */}
            <div className="w-full h-[38px] rounded-full bg-slate-800 border border-slate-700 mb-4 shrink-0"></div>

            {/* 2. Main Input Area (Textarea / Dropzone) */}
            <div className="w-full">
                {/* Text Area Placeholder */}
                <div className="w-full h-54 bg-slate-800/80 rounded-t-md border border-slate-700 border-b-0"></div>

                {/* Bottom Config Bar (Questions & Difficulty) */}
                <div className="w-full h-10 bg-slate-800 border border-slate-700 rounded-b-md mb-4"></div>
            </div>

            <div className="w-1/2 flex flex-col items-center min-[641px]:w-full">
                {/* 3. Language Selector */}
                <div className="w-full mb-4">
                    <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                    <div className="w-full h-[52px] bg-slate-800 border border-slate-700 rounded-lg"></div>
                </div>

                {/* 4. Quiz Type Selector (Mocking 4 options) */}
                <div className="w-full mb-6">
                    <div className="h-4 w-32 bg-slate-700 rounded mb-3"></div>
                    <div className="h-20 bg-slate-800 border border-slate-700 rounded-lg"></div>
                </div>

                {/* 5. Generate Button */}
            </div>
            <div className="w-full h-14 bg-slate-700 rounded-lg mt-1"></div>
        </div>
    );
}