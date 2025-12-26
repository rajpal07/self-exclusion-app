'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AddPatronForm() {
    const [formData, setFormData] = useState({
        patron_id: '',
        name: '',
        dob: '',
        expiry_date: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase
            .from('excluded_persons')
            .insert([formData])

        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'Patron added successfully' })
            setFormData({ patron_id: '', name: '', dob: '', expiry_date: '' })

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    role: 'USER',
                    action: 'Added new patron',
                    details: `ID: ${formData.patron_id}, Name: ${formData.name}`
                })
            }

            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-purple-500/5 rounded-2xl hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                        <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">Add to Exclusion List</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-600">
                    Register a new patron for self-exclusion
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {message && (
                    <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-red-50 border-red-200 shadow-sm'}>
                        <AlertDescription className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="patron-id" className="text-sm font-medium text-gray-700">Patron ID</Label>
                        <Input
                            id="patron-id"
                            type="text"
                            value={formData.patron_id}
                            onChange={(e) => setFormData({ ...formData, patron_id: e.target.value })}
                            placeholder="Enter patron ID"
                            required
                            className="h-11 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="patron-name" className="text-sm font-medium text-gray-700">Name</Label>
                        <Input
                            id="patron-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter full name"
                            required
                            className="h-11 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patron-dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                            <Input
                                id="patron-dob"
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                required
                                className="h-11 border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry-date" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                            <Input
                                id="expiry-date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                required
                                className="h-11 border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        {loading ? 'Adding...' : 'Add Patron'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
