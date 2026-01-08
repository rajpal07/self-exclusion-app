'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, CheckCircle, XCircle, Camera } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// Lazy load IDScanner component
const IDScanner = dynamic(() => import('./IDScanner'), { ssr: false })

export default function SearchForm() {
    const [name, setName] = useState('')
    const [dob, setDob] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [hasCameraSupport, setHasCameraSupport] = useState(false)
    const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

    const supabase = createClient()

    // Check if camera is available
    useEffect(() => {
        const checkCameraSupport = () => {
            if (typeof navigator !== 'undefined' &&
                typeof navigator.mediaDevices !== 'undefined' &&
                typeof navigator.mediaDevices.getUserMedia === 'function') {
                setHasCameraSupport(true)
            }
        }
        checkCameraSupport()
    }, [])

    const handleScanComplete = (data: { name: string; dateOfBirth: string; isAdult?: boolean }) => {
        // Clear previous search results when a new scan happens
        setSearched(false)
        setResult(null)

        setName(data.name)
        setDob(data.dateOfBirth)
        setAgeVerified(data.isAdult ?? null)
        setShowScanner(false)
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSearched(false)
        setResult(null)

        if (!name || !dob) {
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('excluded_persons')
            .select('*')
            .ilike('name', name)
            .eq('dob', dob)
            .maybeSingle()

        let activeExclusion = data

        if (data && data.expiry_date) {
            const expiryDate = new Date(data.expiry_date)
            const today = new Date()

            // additional check: if expiry date is in the past, they are no longer excluded
            if (expiryDate < today) {
                activeExclusion = null
            }
        }

        if (error) {
            console.error(error)
        } else {
            setResult(activeExclusion)
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                role: 'USER',
                action: activeExclusion ? 'Searched patron (Found)' : 'Searched patron (Not Found)',
                details: `Name: ${name}, DOB: ${dob}`
            })
        }

        setSearched(true)
        setLoading(false)
    }

    return (
        <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-indigo-500/5 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
            <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Search className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">Check Patron Entry</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-600">
                    Search for a patron in the exclusion list
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Scan ID Button */}
                    {hasCameraSupport && (
                        <>
                            <Button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                variant="outline"
                                className="w-full h-11 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-medium transition-all"
                            >
                                <Camera className="h-5 w-5 mr-2" />
                                Scan ID Card
                            </Button>

                            <div className="relative">
                                <Separator className="bg-gray-200" />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                                    or enter manually
                                </span>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="search-name" className="text-sm font-medium text-gray-700">Name</Label>
                        <Input
                            id="search-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                // Clear verifications when manually editing
                                setAgeVerified(null)
                                setSearched(false)
                                setResult(null)
                            }}
                            placeholder="Enter full name"
                            required
                            className="h-11 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="search-dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                        <Input
                            id="search-dob"
                            type="date"
                            value={dob}
                            onChange={(e) => {
                                setDob(e.target.value)
                                // Clear verifications when manually editing
                                setAgeVerified(null)
                                setSearched(false)
                                setResult(null)
                            }}
                            required
                            className="h-11 border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        {loading ? 'Checking...' : 'Check'}
                    </Button>
                </form>

                {searched && (
                    <Alert className={result ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-green-50 border-green-200 shadow-sm'}>
                        <div className="flex items-start gap-3">
                            {result ? (
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <AlertTitle className={`text-sm font-semibold ${result ? 'text-red-800' : 'text-green-800'}`}>
                                    {result ? 'Patron Excluded' : 'Not on the list'}
                                </AlertTitle>
                                {result ? (
                                    <AlertDescription className="text-sm text-red-700 mt-1 space-y-0.5">
                                        <p><span className="font-medium">ID:</span> {result.patron_id}</p>
                                        <p><span className="font-medium">Name:</span> {result.name}</p>
                                        <p><span className="font-medium">Expiry:</span> {result.expiry_date}</p>
                                    </AlertDescription>
                                ) : (
                                    <AlertDescription className="text-sm text-green-700 mt-1">
                                        Good to go!
                                    </AlertDescription>
                                )}
                            </div>
                        </div>
                    </Alert>
                )}

                {/* Age Verification Notification */}
                {ageVerified === true && (
                    <Alert className="bg-green-50 border-green-200 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AlertTitle className="text-sm font-semibold text-green-800">
                                    18+
                                </AlertTitle>
                                <AlertDescription className="text-sm text-green-700 mt-1 break-words">
                                    Good to go!
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}

                {ageVerified === false && (
                    <Alert className="bg-red-50 border-red-200 shadow-sm">
                        <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AlertTitle className="text-sm font-semibold text-red-800">
                                    18+
                                </AlertTitle>
                                <AlertDescription className="text-sm text-red-700 mt-1 break-words">
                                    Not found
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}
            </CardContent>

            {/* ID Scanner Modal */}
            {showScanner && (
                <IDScanner
                    onClose={() => setShowScanner(false)}
                    onScanComplete={handleScanComplete}
                />
            )}
        </Card>
    )
}
