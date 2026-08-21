import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(isRemembered: boolean = true) {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {

                            const finalOptions = { ...options }
                            if (!isRemembered) {
                                delete finalOptions.maxAge
                                delete finalOptions.expires
                            }

                            cookieStore.set(name, value, finalOptions)
                        })
                    } catch (error) {
                    }
                },
            },
        }
    )
}