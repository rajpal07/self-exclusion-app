// TypeScript types for ID scanning feature

export interface ScannedData {
    name: string;
    dateOfBirth: string;
    idNumber?: string;
    confidence: number;
    isAdult?: boolean; // Whether person is 18+ years old
}

export interface OCRResult {
    text: string;
    confidence: number;
    parsedData: ScannedData | null;
}

export interface ScanAttempt {
    attemptNumber: number;
    timestamp: Date;
    success: boolean;
    error?: string;
}

export interface ScannerState {
    isScanning: boolean;
    isCameraActive: boolean;
    isProcessing: boolean;
    capturedImage: string | null;
    ocrResult: OCRResult | null;
    attempts: ScanAttempt[];
    error: string | null;
}
