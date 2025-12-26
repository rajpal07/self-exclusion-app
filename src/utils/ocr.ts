
/**
 * OCR utility using Groq LLM
 */

export interface ScannedData {
    name: string | null;
    dateOfBirth: string | null; // YYYY-MM-DD
    idNumber: string | null;
    confidence: number;
    isAdult?: boolean;
}

/**
 * Perform OCR on an image using Groq API
 * @param imageDataUrl Base64 encoded image data URL
 * @returns Scanned data with extraction results
 */
export async function performOCR(imageDataUrl: string): Promise<ScannedData> {
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

        // Calculate isAdult if DOB is present
        let isAdult = false;
        if (result.dateOfBirth) {
            isAdult = calculateAge(result.dateOfBirth) >= 18;
        }

        return {
            name: result.name || null,
            dateOfBirth: result.dateOfBirth || null,
            idNumber: result.idNumber || null,
            confidence: result.confidence || 0,
            isAdult
        };
    } catch (error) {
        console.error('OCR error:', error);
        return {
            name: null,
            dateOfBirth: null,
            idNumber: null,
            confidence: 0,
            isAdult: false
        };
    }
}

/**
 * Calculate age from date of birth
 * @param dobString Date of birth in YYYY-MM-DD format
 * @returns Age in years
 */
function calculateAge(dobString: string): number {
    const dob = new Date(dobString);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}
