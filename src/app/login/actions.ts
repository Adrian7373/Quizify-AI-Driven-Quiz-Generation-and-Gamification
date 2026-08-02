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

export async function signup(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    })

    if (authError) {
        console.error("Signup error:", authError.message)
        redirect('/signup?error=Could not create account')
    }

    // 2. Auth Sync: Create the matching Prisma profile
    if (authData.user) {
        try {
            // We check if it exists first just in case they clicked twice
            const existingUser = await prisma.user.findUnique({
                where: { id: authData.user.id }
            })

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        id: authData.user.id, // Must match Supabase exactly
                        email: authData.user.email!,
                        name: name,
                        aiCredits: 10, // Give them starting credits!
                    },
                })
            }
        } catch (prismaError) {
            console.error("Failed to sync user to Prisma:", prismaError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}