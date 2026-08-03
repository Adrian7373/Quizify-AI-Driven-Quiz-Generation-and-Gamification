import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // If "next" is in search parameters, use it as the redirect target
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successfully verified email and set cookies! Redirect to the app.
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page if the link is invalid or expired
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}