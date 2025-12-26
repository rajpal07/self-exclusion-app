'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Shield, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Header({ userEmail, role }: { userEmail: string, role: string }) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30"></div>
                        <div className="relative rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-2">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Self-Exclusion System
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-700 font-medium">{userEmail}</p>
                        <Badge variant="secondary" className="mt-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 hover:from-indigo-200 hover:to-purple-200 border-0 text-xs font-semibold">
                            {role}
                        </Badge>
                    </div>

                    {role === 'ADMIN' && (
                        <Button
                            onClick={() => router.push('/admin/audit-logs')}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 h-9 transition-all"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Logs
                        </Button>
                    )}

                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:bg-red-50 hover:text-red-600 h-9 w-9 transition-all"
                        title="Sign out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
