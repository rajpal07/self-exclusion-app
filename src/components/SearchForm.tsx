'use client'

import { useState, useEffect } from 'react'
import { searchPatron } from '@/app/actions'
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
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null)



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

        // Calculate age from DOB (works for both scanned and manual entry)
        const calculateAge = (dobString: string): number => {
            const dobDate = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            return age;
        };

        const age = calculateAge(dob);
        const isAdult = age >= 18;
        setCalculatedAge(age); // Store for debugging
        console.log('[AGE_CALC] isAdult:', isAdult, 'age:', age);

        // ALWAYS set age verification - fixes bug where it doesn't update
        setAgeVerified(isAdult);
        console.log('[AGE_CALC] Setting ageVerified to:', isAdult);

        // Call Server Action
        const res = await searchPatron(name, dob)

        if (res.error) {
            console.error(res.error)
        } else {
            setResult(res.data)
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
                            onChange={(e) => setName(e.target.value)}
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
                            onChange={(e) => setDob(e.target.value)}
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
                    <div className="flex-1 space-y-3">
                        {/* 
                            Logic Check: Use String Comparison for reliability
                            Today (UTC ISO) vs Expiry (ISO YYYY-MM-DD)
                        */}
                        {(() => {
                            const today = new Date().toISOString().split('T')[0]
                            const isExcluded = result && result.expiry_date >= today

                            return (
                                <>
                                    {/* Status 1: Exclusion Check */}
                                    <div className={`flex items-start gap-2 text-sm rounded-md p-3 ${isExcluded ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
                                        }`}>
                                        {isExcluded ? (
                                            <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                                        ) : (
                                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-bold">
                                                {result && isExcluded
                                                    ? 'Patron Excluded'
                                                    : result
                                                        ? 'Past Exclusion (Expired)'
                                                        : 'Not on Exclusion List'
                                                }
                                            </p>
                                            {result && (
                                                <div className="mt-1 text-xs space-y-0.5 opacity-90">
                                                    <p><span className="font-semibold">ID:</span> {result.patron_id}</p>
                                                    <p><span className="font-semibold">Name:</span> {result.name}</p>
                                                    <p><span className="font-semibold">Expiry:</span> {result.expiry_date}</p>
                                                    {!isExcluded && <p className="font-bold text-green-700">(Allowed: Expiry date passed)</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status 2: Age Check */}
                                    <div className={`flex items-start gap-2 text-sm rounded-md p-3 ${ageVerified === false ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
                                        }`}>
                                        {ageVerified === false ? (
                                            <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                                        ) : (
                                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-bold">
                                                {ageVerified === true ? 'Age Verified: 18+' : 'Under 18 / Verification Failed'}
                                            </p>
                                            <p className="text-xs opacity-90 mt-0.5">
                                                {ageVerified === true ? 'Allowed to enter (if not excluded)' : 'Entry Denied due to Age'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
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
