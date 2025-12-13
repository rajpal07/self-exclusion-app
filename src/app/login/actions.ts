'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        }
    })

    if (error) {
        console.error('Signup error:', error)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Check if email confirmation is required
    if (data?.user && !data.session) {
        redirect('/login?error=Please check your email to confirm your account before logging in')
    }

    // Create profile with default USER role
    if (data?.user?.id) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id })
        if (profileError) {
            console.error('Profile creation error:', profileError)
        }
    }

    // If we have a session, user is logged in automatically (email confirmation disabled)
    if (data?.session) {
        revalidatePath('/', 'layout')
        redirect('/')
    }

    // Otherwise redirect to login with success message
    redirect('/login?error=Account created! Please check your email to confirm your account.')
}
