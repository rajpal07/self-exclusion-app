import { performOCR } from '@/utils/ocr'

describe('OCR Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('performOCR', () => {
        it('should successfully extract data from valid ID image', async () => {
            const mockResponse = {
                name: 'John Doe',
                dateOfBirth: '1990-01-15',
                idNumber: 'DL123456',
                confidence: 95,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result).toEqual({
                name: 'John Doe',
                dateOfBirth: '1990-01-15',
                idNumber: 'DL123456',
                confidence: 95,
                isAdult: true,
            })
        })

        it('should calculate isAdult correctly for adults', async () => {
            const mockResponse = {
                name: 'Jane Smith',
                dateOfBirth: '1995-06-20',
                idNumber: 'DL789012',
                confidence: 90,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result.isAdult).toBe(true)
        })

        it('should calculate isAdult correctly for minors', async () => {
            const today = new Date()
            const minorDOB = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
            const dobString = minorDOB.toISOString().split('T')[0]

            const mockResponse = {
                name: 'Minor Person',
                dateOfBirth: dobString,
                idNumber: 'DL345678',
                confidence: 88,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result.isAdult).toBe(false)
        })

        it('should handle API errors gracefully', async () => {
            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'API Error' }),
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result).toEqual({
                name: null,
                dateOfBirth: null,
                idNumber: null,
                confidence: 0,
                isAdult: false,
            })
        })

        it('should handle network errors gracefully', async () => {
            global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

            const result = await performOCR('data:image/png;base64,test')

            expect(result).toEqual({
                name: null,
                dateOfBirth: null,
                idNumber: null,
                confidence: 0,
                isAdult: false,
            })
        })

        it('should handle missing fields in response', async () => {
            const mockResponse = {
                name: null,
                dateOfBirth: null,
                idNumber: null,
                confidence: 0,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result.name).toBeNull()
            expect(result.dateOfBirth).toBeNull()
            expect(result.idNumber).toBeNull()
            expect(result.isAdult).toBe(false)
        })

        it('should send correct request to OCR API', async () => {
            const mockFetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: 'Test',
                    dateOfBirth: '2000-01-01',
                    idNumber: 'TEST123',
                    confidence: 80,
                }),
            } as Response)

            global.fetch = mockFetch

            const imageData = 'data:image/png;base64,testImageData'
            await performOCR(imageData)

            expect(mockFetch).toHaveBeenCalledWith('/api/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            })
        })
    })

    describe('Age Calculation Edge Cases', () => {
        it('should handle birthday today (exactly 18 years old)', async () => {
            const today = new Date()
            const exactlyEighteenYearsAgo = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate()
            )
            const dobString = exactlyEighteenYearsAgo.toISOString().split('T')[0]

            const mockResponse = {
                name: 'Birthday Person',
                dateOfBirth: dobString,
                idNumber: 'BD123',
                confidence: 95,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result.isAdult).toBe(true)
        })

        it('should handle birthday tomorrow (not yet 18)', async () => {
            const today = new Date()
            const almostEighteen = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate() + 1
            )
            const dobString = almostEighteen.toISOString().split('T')[0]

            const mockResponse = {
                name: 'Almost Adult',
                dateOfBirth: dobString,
                idNumber: 'AA123',
                confidence: 95,
            }

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await performOCR('data:image/png;base64,test')

            expect(result.isAdult).toBe(false)
        })
    })
})
