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

        console.log('Searching for:', { name, dob })

        const { data, error } = await supabase
            .from('excluded_persons')
            .select('*')
            .ilike('name', name)
            .eq('dob', dob)
            .maybeSingle()

        let activeExclusion = data

        if (data) {
            console.log('Found record:', data)
            if (data.expiry_date) {
                const expiryDate = new Date(data.expiry_date)
                const today = new Date()

                console.log('Date Check:', { expiryDate, today, isExpired: expiryDate < today })

                // additional check: if expiry date is in the past, they are no longer excluded
                if (expiryDate < today) {
                    console.log('Marking as expired/null')
                    activeExclusion = null
                }
            }
        } else {
            console.log('No record found in database for these details.')
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

                {/* Unified Result Display - Only show after search/check button is clicked */}
                {searched && (
                    <Alert className={`
                        ${(result || ageVerified === false) ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-green-50 border-green-200 shadow-sm'}
                    `}>
                        <div className="flex items-start gap-3">
                            {(result || ageVerified === false) ? (
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <AlertTitle className={`text-sm font-semibold ${(result || ageVerified === false) ? 'text-red-800' : 'text-green-800'}`}>
                                    {result ? 'ENTRY DENIED: Patron Excluded' :
                                        ageVerified === false ? 'ENTRY DENIED: Underage' :
                                            'ENTRY ALLOWED'}
                                </AlertTitle>

                                <div className="mt-2 space-y-2">
                                    {/* Exclusion Details */}
                                    {result ? (
                                        <div className="text-sm text-red-700 bg-red-100/50 p-2 rounded border border-red-100">
                                            <p className="font-bold mb-1">Self-Exclusion Match:</p>
                                            <p><span className="font-medium">ID:</span> {result.patron_id}</p>
                                            <p><span className="font-medium">Name:</span> {result.name}</p>
                                            <p><span className="font-medium">Expiry:</span> {result.expiry_date}</p>
                                        </div>
                                    ) : searched && (
                                        <p className="text-sm text-green-700">
                                            No active exclusion found.
                                        </p>
                                    )}

                                    {/* Age Verification Details */}
                                    {ageVerified !== null && (
                                        <div className={`text-sm p-2 rounded border ${ageVerified ? 'bg-green-100/50 border-green-100 text-green-700' : 'bg-red-100/50 border-red-100 text-red-700'}`}>
                                            <p className="font-bold mb-1">Age Verification:</p>
                                            <p>
                                                {ageVerified ? 'User is 18+ (Adult)' : 'User is UNDERAGE'}
                                            </p>
                                        </div>
                                    )}
                                </div>
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
