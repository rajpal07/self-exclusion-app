'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addPatron(formData: {
    patron_id: string
    name: string
    dob: string
    expiry_date: string
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const { patron_id, name, dob, expiry_date } = formData

    try {
        // Check for existing patron
        const existing = await db.query(
            'SELECT id FROM excluded_persons WHERE (name ILIKE $1 AND dob = $2) OR patron_id = $3 LIMIT 1',
            [name, dob, patron_id]
        )

        if (existing.rows.length > 0) {
            return { error: 'Patron already exists (matching ID or Name+DOB)' }
        }

        await db.query(
            'INSERT INTO excluded_persons (patron_id, name, dob, expiry_date) VALUES ($1, $2, $3, $4)',
            [patron_id, name, dob, expiry_date]
        )

        // Audit Log
        if (session.user.id) {
            await db.query(
                'INSERT INTO audit_logs (user_id, role, action, details) VALUES ($1, $2, $3, $4)',
                [session.user.id, 'USER', 'Added new patron', `ID: ${patron_id}, Name: ${name}`]
            )
        }

        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error("Add Patron Error", e)
        return { error: e.message || 'Failed to add patron' }
    }
}

export async function searchPatron(name: string, dob: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        const result = await db.query(
            'SELECT * FROM excluded_persons WHERE name ILIKE $1 AND dob = $2 LIMIT 1',
            [name, dob]
        )

        const data = result.rows[0] ? {
            ...result.rows[0],
            dob: new Date(result.rows[0].dob).toISOString().split('T')[0],
            expiry_date: new Date(result.rows[0].expiry_date).toISOString().split('T')[0],
            added_date: new Date(result.rows[0].added_date).toISOString().split('T')[0]
        } : null

        // Audit Log
        if (session.user.id) {
            await db.query(
                'INSERT INTO audit_logs (user_id, role, action, details) VALUES ($1, $2, $3, $4)',
                [session.user.id, 'USER', data ? 'Searched patron (Found)' : 'Searched patron (Not Found)', `Name: ${name}, DOB: ${dob}`]
            )
        }

        return { data }
    } catch (e: any) {
        console.error("Search Patron Error", e)
        return { error: e.message || 'Failed to search patron' }
    }
}
