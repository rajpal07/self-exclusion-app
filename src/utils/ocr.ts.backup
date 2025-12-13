/**
 * OCR utility using Google Cloud Vision API
 */

export interface TextBlock {
    text: string;
    boundingBox: {
        vertices: Array<{ x: number; y: number }>;
        x: number;
        y: number;
    };
}

export interface OCRResult {
    text: string;
    confidence: number;
    textBlocks?: TextBlock[];
}

/**
 * Perform OCR on an image using Google Cloud Vision API
 * @param imageDataUrl Base64 encoded image data URL
 * @returns OCR result with text, confidence, and positioned text blocks
 */
export async function performOCR(imageDataUrl: string): Promise<OCRResult> {
    try {
        const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageDataUrl }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'OCR request failed');
        }

        const result = await response.json();
        return {
            text: result.text || '',
            confidence: result.confidence || 0,
            textBlocks: result.textBlocks || [],
        };
    } catch (error) {
        console.error('OCR error:', error);
        return {
            text: '',
            confidence: 0,
            textBlocks: [],
        };
    }
}

/**
 * Extract and validate name from OCR text
 */
export function validateName(text: string): string | null {
    if (!text) return null;

    // Clean up the text
    const cleaned = text.trim().toUpperCase();

    // Name should be 2-50 characters, letters and spaces only
    if (cleaned.length < 2 || cleaned.length > 50) return null;
    if (!/^[A-Z\s]+$/.test(cleaned)) return null;

    return cleaned;
}

/**
 * Extract and validate date of birth from OCR text
 * Expected format: DD-MM-YYYY or DD/MM/YYYY
 */
export function validateDOB(text: string): string | null {
    if (!text) return null;

    // Try to find date pattern
    const datePattern = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/;
    const match = text.match(datePattern);

    if (!match) return null;

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validate ranges
    if (dayNum < 1 || dayNum > 31) return null;
    if (monthNum < 1 || monthNum > 12) return null;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return null;

    // Return in consistent format
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
}
