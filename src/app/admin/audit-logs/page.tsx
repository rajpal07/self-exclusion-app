import { auth } from '@/lib/auth'
import { db } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AuditLogsPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const user = session?.user

    if (!user) {
        redirect('/login')
    }

    // Check role
    let role = 'USER'
    try {
        const profileResult = await db.query('SELECT role FROM profiles WHERE id = $1', [user.id])
        if (profileResult.rows.length > 0) {
            role = profileResult.rows[0].role
        }
    } catch (e) {
        console.error("Failed to fetch profile", e)
    }

    if (role !== 'ADMIN') {
        redirect('/')
    }

    // Fetch logs
    let logs: any[] = []
    try {
        const logsResult = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100')
        logs = logsResult.rows
    } catch (e) {
        console.error("Failed to fetch logs", e)
        // Ensure logs is empty array
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs?.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
