"use server"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { headers } from "next/headers"
import { Role } from "@/generated/prisma/enums"

export async function signUp(formData: FormData) {
    const name = formData.get('name') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = formData.get('password') as string
    const role = (formData.get("role") as Role | null) || Role.STUDENT

    const supabase = await createClient()

    const origin = (await headers()).get('origin')
    const redirectTo = origin
        ? `${origin}/api/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                emailRedirectTo: redirectTo
            },
        },
    })

    if (authError) {
        console.error("Signup error:", authError)
        redirect(`/signup?error=${encodeURIComponent(authError.message || 'Could not create account')}`)
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
                        role: role
                    },
                })
            }
        } catch (prismaError) {
            console.error("Failed to sync user to Prisma:", prismaError)
        }
    }

    revalidatePath('/')
    redirect('/dashboard')
}