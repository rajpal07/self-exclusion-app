import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SearchForm from '@/components/SearchForm'
import AddPatronForm from '@/components/AddPatronForm'
import ExclusionList from '@/components/ExclusionList'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'USER'

  // Fetch exclusions
  const { data: exclusions } = await supabase
    .from('excluded_persons')
    .select('*')
    .order('added_date', { ascending: false })

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
