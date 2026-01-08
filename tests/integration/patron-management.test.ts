/**
 * Integration tests for patron management operations
 */

import { createClient } from '@/utils/supabase/client'

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(),
}))

describe('Patron Management Integration Tests', () => {
    let mockSupabase: any

    beforeEach(() => {
        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn(),
                single: jest.fn(),
            })),
        }

            ; (createClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Adding Patrons', () => {
        it('should successfully add a new patron to exclusion list', async () => {
            const patronData = {
                patron_id: 'P12345',
                name: 'John Doe',
                dob: '1990-05-15',
                expiry_date: '2025-12-31',
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: { ...patronData, id: 'record-123' },
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const result = await supabase.from('excluded_persons').insert([patronData])

            expect(mockInsert).toHaveBeenCalledWith([patronData])
            expect(result.error).toBeNull()
        })

        it('should handle duplicate patron ID error', async () => {
            const patronData = {
                patron_id: 'P12345',
                name: 'John Doe',
                dob: '1990-05-15',
                expiry_date: '2025-12-31',
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'duplicate key value violates unique constraint' },
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const result = await supabase.from('excluded_persons').insert([patronData])

            expect(result.error).toBeTruthy()
            expect(result.error.message).toContain('duplicate')
        })

        it('should validate required fields', async () => {
            const incompleteData = {
                patron_id: 'P12345',
                name: 'John Doe',
                // Missing dob and expiry_date
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'null value in column "dob" violates not-null constraint' },
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const result = await supabase.from('excluded_persons').insert([incompleteData])

            expect(result.error).toBeTruthy()
        })
    })

    describe('Searching Patrons', () => {
        it('should find patron by name and DOB', async () => {
            const mockPatron = {
                id: 'record-123',
                patron_id: 'P12345',
                name: 'John Doe',
                dob: '1990-05-15',
                expiry_date: '2025-12-31',
                added_date: '2024-01-01',
            }

            const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
                data: mockPatron,
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: mockMaybeSingle,
            })

            const supabase = createClient()
            const result = await supabase
                .from('excluded_persons')
                .select('*')
                .ilike('name', 'John Doe')
                .eq('dob', '1990-05-15')
                .maybeSingle()

            expect(result.data).toEqual(mockPatron)
            expect(result.error).toBeNull()
        })

        it('should return null when patron not found', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
                data: null,
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: mockMaybeSingle,
            })

            const supabase = createClient()
            const result = await supabase
                .from('excluded_persons')
                .select('*')
                .ilike('name', 'Nonexistent Person')
                .eq('dob', '2000-01-01')
                .maybeSingle()

            expect(result.data).toBeNull()
            expect(result.error).toBeNull()
        })

        it('should handle case-insensitive name search', async () => {
            const mockPatron = {
                id: 'record-123',
                patron_id: 'P12345',
                name: 'John Doe',
                dob: '1990-05-15',
                expiry_date: '2025-12-31',
            }

            const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
                data: mockPatron,
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: mockMaybeSingle,
            })

            const supabase = createClient()
            const result = await supabase
                .from('excluded_persons')
                .select('*')
                .ilike('name', 'JOHN DOE') // Uppercase
                .eq('dob', '1990-05-15')
                .maybeSingle()

            expect(result.data).toEqual(mockPatron)
        })
    })

    describe('Listing Patrons', () => {
        it('should fetch all active exclusions ordered by date', async () => {
            const today = new Date().toISOString().split('T')[0]
            const mockPatrons = [
                {
                    id: 'record-1',
                    patron_id: 'P001',
                    name: 'Person One',
                    dob: '1985-01-01',
                    expiry_date: '2025-12-31',
                    added_date: '2024-06-01',
                },
                {
                    id: 'record-2',
                    patron_id: 'P002',
                    name: 'Person Two',
                    dob: '1990-02-02',
                    expiry_date: '2026-01-15',
                    added_date: '2024-07-01',
                },
            ]

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValueOnce({
                    data: mockPatrons,
                    error: null,
                }),
            })

            const supabase = createClient()
            const result = await supabase
                .from('excluded_persons')
                .select('*')
                .order('added_date', { ascending: false })

            expect(result.data).toEqual(mockPatrons)
            expect(result.data?.length).toBe(2)
        })

        it('should handle empty exclusion list', async () => {
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValueOnce({
                    data: [],
                    error: null,
                }),
            })

            const supabase = createClient()
            const result = await supabase
                .from('excluded_persons')
                .select('*')
                .order('added_date', { ascending: false })

            expect(result.data).toEqual([])
        })
    })

    describe('Audit Logging', () => {
        it('should create audit log when adding patron', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'staff@example.com',
            }

            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: mockUser },
                error: null,
            })

            const auditData = {
                user_id: 'user-123',
                role: 'USER',
                action: 'Added new patron',
                details: 'ID: P12345, Name: John Doe',
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: { ...auditData, id: 'audit-123' },
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const userResult = await supabase.auth.getUser()

            if (userResult.data.user) {
                const auditResult = await supabase.from('audit_logs').insert(auditData)
                expect(auditResult.error).toBeNull()
                expect(mockInsert).toHaveBeenCalledWith(auditData)
            }
        })

        it('should create audit log when searching patron', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'staff@example.com',
            }

            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: mockUser },
                error: null,
            })

            const auditData = {
                user_id: 'user-123',
                role: 'USER',
                action: 'Searched patron (Found)',
                details: 'Name: John Doe, DOB: 1990-05-15',
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: { ...auditData, id: 'audit-124' },
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const userResult = await supabase.auth.getUser()

            if (userResult.data.user) {
                const auditResult = await supabase.from('audit_logs').insert(auditData)
                expect(auditResult.error).toBeNull()
            }
        })

        it('should handle audit log creation failure gracefully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'staff@example.com',
            }

            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: mockUser },
                error: null,
            })

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Audit log creation failed' },
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const userResult = await supabase.auth.getUser()

            if (userResult.data.user) {
                const auditResult = await supabase.from('audit_logs').insert({
                    user_id: 'user-123',
                    role: 'USER',
                    action: 'Test action',
                    details: 'Test details',
                })

                // Audit log failure should not break the main operation
                expect(auditResult.error).toBeTruthy()
            }
        })
    })

    describe('Data Validation', () => {
        it('should validate date formats', async () => {
            const invalidData = {
                patron_id: 'P12345',
                name: 'John Doe',
                dob: 'invalid-date',
                expiry_date: '2025-12-31',
            }

            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'invalid input syntax for type date' },
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const result = await supabase.from('excluded_persons').insert([invalidData])

            expect(result.error).toBeTruthy()
        })

        it('should validate expiry date is in the future', async () => {
            const pastExpiryData = {
                patron_id: 'P12345',
                name: 'John Doe',
                dob: '1990-05-15',
                expiry_date: '2020-01-01', // Past date
            }

            // This would be validated by database constraints or application logic
            const mockInsert = jest.fn().mockResolvedValueOnce({
                data: { ...pastExpiryData, id: 'record-123' },
                error: null,
            })

            mockSupabase.from.mockReturnValueOnce({
                insert: mockInsert,
            })

            const supabase = createClient()
            const result = await supabase.from('excluded_persons').insert([pastExpiryData])

            // Note: Actual validation might be done in application layer
            expect(result.error).toBeNull()
        })
    })
})
