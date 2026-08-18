"use server"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

export async function signUp(formData: FormData) {
    const name = formData.get('name') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = formData.get('password') as string
    const role = (formData.get("role") as Role | null) || Role.STUDENT

    const supabase = await createClient()

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            }
        }
    })

    if (authError) {
        console.error("Signup error:", authError)
        redirect(`/signup?error=${encodeURIComponent(authError.message || 'Could not create account')}`)
    }

    // 2. Auth Sync: Create the matching Prisma profile
    if (authData.user) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: authData.user.id }
            })

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        id: authData.user.id, // Must match Supabase exactly
                        email: authData.user.email!,
                        name: name,
                        aiCredits: 10,
                        role: role
                    },
                })
            }
        } catch (prismaError) {
            console.error("Failed to sync user to Prisma:", prismaError)
        }
    }

    // This makes sure they don't get kicked back to the login screen after signing up.
    await supabase.auth.signInWithPassword({
        email,
        password
    })

    revalidatePath('/')
    redirect('/dashboard')
}