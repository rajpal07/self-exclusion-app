'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ExclusionList({ active, expired }: { active: any[], expired: any[] }) {
    const [tab, setTab] = useState<'active' | 'expired'>('active')

    const data = tab === 'active' ? active : expired

    return (
        <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-indigo-500/5 rounded-2xl">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800">Exclusion Records</CardTitle>
                    <div className="flex gap-2">
                        <Badge
                            variant={tab === 'active' ? 'default' : 'outline'}
                            className={`cursor-pointer transition-all font-semibold ${tab === 'active'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border-0 shadow-md'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-100 border-gray-300'
                                }`}
                            onClick={() => setTab('active')}
                        >
                            Active ({active.length})
                        </Badge>
                        <Badge
                            variant={tab === 'expired' ? 'default' : 'outline'}
                            className={`cursor-pointer transition-all font-semibold ${tab === 'expired'
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 border-0 shadow-md'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-100 border-gray-300'
                                }`}
                            onClick={() => setTab('expired')}
                        >
                            Expired ({expired.length})
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <Separator className="bg-gray-200" />
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expiry</th>
                                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Added</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data.map((person) => (
                                <tr key={person.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.patron_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{person.name}</td>
                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.dob}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.expiry_date}</td>
                                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.added_date}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
