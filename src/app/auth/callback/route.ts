import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // If no code is present, something went wrong
    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=Invalid_Login`)
    }

    const supabase = await createClient()

    // 1. Exchange the code for a secure session cookie
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=${error.message}`)
    }

    // 2. Prisma Sync: Check if user exists in the database
    if (data.user) {
        const existingUser = await prisma.user.findUnique({
            where: { id: data.user.id }
        })

        // If they don't exist, this is a new signup! Create their profile.
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    id: data.user.id,
                    email: data.user.email!,
                    // Grab the name from their Google/Facebook profile metadata
                    name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
                    aiCredits: 10,
                }
            })
        }
    }

    // 3. Redirect them to the dashboard
    return NextResponse.redirect(`${origin}/dashboard`)
}