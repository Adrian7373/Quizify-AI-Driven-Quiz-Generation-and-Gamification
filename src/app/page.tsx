import { createClient } from "@/utils/supabase/server";
import { getUser } from "./actions";
import HomeClient from "./_components/HomeClient";
import NavBar from "./_components/NavBar";
import { Suspense } from "react";
import GeneratorSkeleton from "./_components/GeneratorSkeleton";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quizify | Turn Any Text Into an Assessment in Seconds',
  description: 'Paste your source material, and Quizify instantly generates accurate, gamified multiple-choice questions using AI.',
  openGraph: {
    title: 'Quizify AI',
    description: 'Instant AI Quiz Generation',
  }
};

export type InputOption = 'File' | 'Text' | 'Image';
export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION' | 'ESSAY';
export type DifficultyType = "easy" | "normal" | "hard"

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: Question[];
}

export interface QuizInfo {
  id: string;
  title: string;
  description: string;
}

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  currentStreak: number;
  aiCredits: number;
  quizzes: QuizInfo[]
};

async function AsyncNavBar() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let appUser = null;
  if (authUser) {
    const response = await getUser(authUser.id);
    if (response.user) appUser = response.user;
  }

  return <NavBar user={appUser} />;
}

async function GeneratorWrapper() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let appUser = null;
  if (authUser) {
    const response = await getUser(authUser.id);
    if (response.user) appUser = response.user;
  }

  return <HomeClient initialUser={appUser} />;
}


export default function Home() {
  return (
    <div className="bg-dark min-h-dvh flex flex-col box-border">

      <Suspense fallback={<NavBar isFallback={true} user={null} />}>
        <AsyncNavBar />
      </Suspense>

      <main className="max-[1024px]:pt-20 py-2 px-6 flex flex-col items-center flex-1 overflow-y-auto lg:flex-row lg:justify-center lg:gap-10 xl:gap-15">

        {/* Static Hero Text (Loads Instantly alongside the fallbacks) */}
        <div className="py-7 text-white font-inter flex flex-col gap-2 lg:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-2xl text-center lg:text-4xl lg:text-left">Turn Any Text Into an Assessment in Seconds</h1>
          <p className="text-md text-center lg:text-xl lg:font-light lg:text-left text-slate-300">Paste your source material, and Quizify instantly generates accurate, gamified multiple-choice questions.</p>
        </div>

        {/* Instantly shows the GeneratorSkeleton. Swaps to GeneratorWrapper when ready. */}
        <Suspense fallback={<GeneratorSkeleton />}>
          <GeneratorWrapper />
        </Suspense>

      </main>
    </div>
  );
}