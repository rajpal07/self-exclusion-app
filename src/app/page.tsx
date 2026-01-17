import { auth } from '@/lib/auth'
import { db } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SearchForm from '@/components/SearchForm'
import AddPatronForm from '@/components/AddPatronForm'
import ExclusionList from '@/components/ExclusionList'

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for role
  // Note: New Better Auth users might not have a profile row in 'profiles' unless we created one on signup.
  // The signup action implementation (to be checked) should handle this, or we default to USER.
  let role = 'USER'

  // We need to check if profiles table uses uuid matching Better Auth id.
  // Assuming 'profiles' table exists and links to user id.
  try {
    const profileResult = await db.query('SELECT role FROM profiles WHERE id = $1', [user.id])
    if (profileResult.rows.length > 0) {
      role = profileResult.rows[0].role
    }
  } catch (e) {
    console.error("Failed to fetch profile", e)
    // Fallback or ignore if table structure mismatch pending migration
  }

  // Fetch exclusions
  let exclusions: any[] = []
  try {
    const exclusionsResult = await db.query('SELECT * FROM excluded_persons ORDER BY added_date DESC')
    exclusions = exclusionsResult.rows
  } catch (e) {
    console.error("Failed to fetch exclusions", e)
  }

  const today = new Date().toISOString().split('T')[0]

  const active = exclusions?.filter(p => p.expiry_date >= today) || []
  const expired = exclusions?.filter(p => p.expiry_date < today) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      <Header userEmail={user.email!} role={role} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Search */}
          <div className="w-full">
            <SearchForm />
          </div>

          {/* Right Column: Add */}
          <div className="w-full">
            <AddPatronForm />
          </div>
        </div>

        {/* Full Width: Lists */}
        <div className="mt-8">
          <ExclusionList active={active} expired={expired} />
        </div>
      </main>
    </div>
  )
}
