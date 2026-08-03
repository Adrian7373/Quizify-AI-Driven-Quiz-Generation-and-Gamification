"use server"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function signInWithProvider(formData: FormData) {
    const provider = formData.get('provider') as 'google' | 'facebook'
    const supabase = await createClient()

    // The URL they will return to after authenticating
    // Use localhost for development, update to your real domain in production
    const redirectTo = process.env.NODE_ENV === 'production'
        ? 'https://yourwebsite.com/auth/callback'
        : 'http://localhost:3000/auth/callback'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo,
        },
    })

    if (error) {
        console.error("OAuth error:", error.message)
        redirect('/login?error=Could not initiate social login')
    }

    // Redirect the user to the Google/Facebook login screen
    if (data.url) {
        redirect(data.url)
    }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("Login failed:", error.message)
        redirect('/login?error=Invalid email or password')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}