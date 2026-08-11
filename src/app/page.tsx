import { createClient } from "@/utils/supabase/server";
import { getUser } from "./actions";
import HomeClient from "./_components/HomeClient";

// Export your types here so other components can still import them from "@/app/page"
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
  role: string;
  aiCredits: number;
  quizzes: QuizInfo[]
};

export default async function Home() {
  // 1. Initialize the Server Client
  const supabase = await createClient();

  // 2. Fetch the session securely on the server
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let appUser: AppUser | null = null;

  // 3. If they have a session, fetch their full database profile
  if (authUser) {
    const response = await getUser(authUser.id);
    if (response.user) {
      appUser = response.user;
    }
  }

  // 4. Pass the user down to the Client Component. No loading spinners required!
  return <HomeClient initialUser={appUser} />;
}