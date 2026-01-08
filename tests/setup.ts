import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.GROQ_API_KEY = 'test-groq-key'

// Mock fetch globally
global.fetch = jest.fn()

// Mock navigator.mediaDevices for camera tests
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: jest.fn(),
    },
    writable: true,
})
