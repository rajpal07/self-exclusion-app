// ID card data parser for Australian ID cards
// Extracts Name, DOB, and ID number from OCR text

import { ScannedData } from '@/types/scanning';
import { TextBlock } from '@/utils/ocr';

interface ParseResult {
    value: string;
    confidence: number;
}

/**
 * Parse OCR data using positional information (RECOMMENDED)
 * Uses bounding box coordinates to identify text in specific regions
 */
export function parseIDCardDataWithPosition(text: string, textBlocks: TextBlock[]): ScannedData | null {
    console.log('[ID_PARSER_SPATIAL] Processing', textBlocks.length, 'text blocks');

    if (!textBlocks || textBlocks.length === 0) {
        // Fallback to text-only parsing
        return parseIDCardData(text);
    }

    // Find image dimensions from the text blocks
    const maxX = Math.max(...textBlocks.map(b => b.boundingBox.x));
    const maxY = Math.max(...textBlocks.map(b => b.boundingBox.y));

    console.log('[ID_PARSER_SPATIAL] Image dimensions:', maxX, 'x', maxY);

    // For Victoria driver's licenses, the name appears in the upper-left region
    // Typically: X < 50% of width, Y between 15-40% of height (below blue header)
    const nameRegionBlocks = textBlocks.filter(block => {
        const normalizedX = block.boundingBox.x / maxX;
        const normalizedY = block.boundingBox.y / maxY;

        const inNameRegion = normalizedX < 0.5 && normalizedY > 0.15 && normalizedY < 0.45;

        if (inNameRegion) {
            console.log('[ID_PARSER_SPATIAL] Name region block:', block.text, 'at', normalizedX.toFixed(2), normalizedY.toFixed(2));
        }

        return inNameRegion;
    });

    if (nameRegionBlocks.length === 0) {
        console.log('[ID_PARSER_SPATIAL] No blocks in name region - falling back');
        return parseIDCardData(text);
    }

    // Sort blocks by Y position (top to bottom), then by X position (left to right)
    nameRegionBlocks.sort((a, b) => {
        const yDiff = a.boundingBox.y - b.boundingBox.y;
        if (Math.abs(yDiff) > 10) return yDiff; // Different lines
        return a.boundingBox.x - b.boundingBox.x; // Same line, sort left to right
    });

    // Group blocks into lines based on Y-position proximity
    const lines: Array<{ text: string; y: number }> = [];
    let currentLine: string[] = [];
    let currentY = nameRegionBlocks[0].boundingBox.y;

    for (const block of nameRegionBlocks) {
        // If Y position differs by more than 10 pixels, it's a new line
        if (Math.abs(block.boundingBox.y - currentY) > 10) {
            if (currentLine.length > 0) {
                lines.push({ text: currentLine.join(' '), y: currentY });
                currentLine = [];
            }
            currentY = block.boundingBox.y;
        }
        currentLine.push(block.text);
    }

    // Don't forget the last line
    if (currentLine.length > 0) {
        lines.push({ text: currentLine.join(' '), y: currentY });
    }

    console.log('[ID_PARSER_SPATIAL] Grouped into lines:', lines.map(l => `"${l.text}" at Y=${l.y}`));

    // Filter out lines with more than 3 words (likely address, not name)
    const nameLines = lines.filter(line => {
        const wordCount = line.text.split(/\s+/).filter(w => w.length >= 2).length;
        if (wordCount > 3) {
            console.log('[ID_PARSER_SPATIAL] Rejected line (too many words):', line.text, `(${wordCount} words)`);
            return false;
        }
        return true;
    });

    // Detect line spacing gaps - if there's a large gap (>20px), stop there
    // This indicates transition from name to address section
    const finalNameLines: Array<{ text: string; y: number }> = [];
    for (let i = 0; i < nameLines.length; i++) {
        finalNameLines.push(nameLines[i]);

        // Check gap to next line
        if (i < nameLines.length - 1) {
            const gap = nameLines[i + 1].y - nameLines[i].y;
            if (gap > 20) {
                console.log('[ID_PARSER_SPATIAL] Large gap detected:', gap, 'px - stopping here');
                break; // Stop before the gap (address section starts)
            }
        }
    }

    console.log('[ID_PARSER_SPATIAL] Final name lines after filtering:', finalNameLines.map(l => l.text));

    // Additional validation: Check if there are more lines below in the original text
    // If the line immediately below the detected name contains a date, it's likely not a name
    // (e.g., "LICENCE EXPIRY" followed by a date)
    const allTextLines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Take only the first 1-2 lines as the name
    // If first line has 2+ words, it's likely the full name
    // If first line has 1 word, combine with second line (first name + surname)
    let nameText = '';
    const firstLineWords = finalNameLines[0]?.text.split(/\s+/).filter(w => w.length >= 2) || [];

    if (firstLineWords.length >= 2) {
        // Full name on one line (e.g., "JANE CITIZEN")
        nameText = finalNameLines[0].text;
        console.log('[ID_PARSER_SPATIAL] Single-line name detected');

        // Validate: Check if next line in full text contains a date
        const nameIndex = allTextLines.findIndex(line => line.includes(nameText));
        if (nameIndex !== -1 && nameIndex < allTextLines.length - 1) {
            const nextLine = allTextLines[nameIndex + 1];
            const hasDatePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(nextLine);
            if (hasDatePattern) {
                console.log('[ID_PARSER_SPATIAL] Rejected - next line contains date:', nextLine);
                nameText = ''; // Reject this candidate
            }
        }
    } else if (firstLineWords.length === 1 && finalNameLines.length >= 2) {
        // Name split across two lines (e.g., "JANE" + "CITIZEN")
        const secondLineWords = finalNameLines[1]?.text.split(/\s+/).filter(w => w.length >= 2) || [];
        if (secondLineWords.length >= 1 && secondLineWords.length <= 2) {
            nameText = `${finalNameLines[0].text} ${finalNameLines[1].text}`;
            console.log('[ID_PARSER_SPATIAL] Multi-line name detected');
        }
    }

    console.log('[ID_PARSER_SPATIAL] Name text:', nameText);

    // Check against exclusion list
    const excludeList = [
        'DRIVER LICENCE', 'DRIVER LICENSE', 'DRIVERS LICENCE', 'DRIVERS LICENSE',
        'VICTORIA', 'VICTORIAN', 'VICTORIA AUSTRALIA', 'AUSTRALIAN', 'AUSTRALIA',
        'GOVERNMENT', 'CARD NUMBER', 'LICENSE NUMBER', 'LICENCE NUMBER',
        'DATE OF BIRTH', 'EXPIRY DATE', 'ISSUE DATE', 'EXPIRY', 'LICENCE EXPIRY', 'LICENSE EXPIRY',
        'LICENCE TYPE', 'LICENSE TYPE', 'ADDRESS', 'RESTRICTIONS', 'CONDITIONS', 'CLASS', 'SIGNATURE', 'PHOTO', 'CARD',
        'CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'HEAVY', 'LIGHT', 'MEDIUM', 'RIDER',
        'CONDITION', 'RESTRICTION'
    ];

    const upperNameText = nameText.toUpperCase().trim();
    for (const excluded of excludeList) {
        if (upperNameText === excluded || upperNameText.includes(excluded)) {
            console.log('[ID_PARSER_SPATIAL] Rejected - matches exclusion list:', excluded);
            nameText = '';
            break;
        }
    }

    // Use the existing text-based parser for DOB and other fields
    const textLines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const dob = extractDateOfBirth(textLines);
    const idNumber = extractIDNumber(textLines);

    // Validate the name from the position-based extraction
    const nameWords = nameText.split(/\s+/).filter(w => w.length >= 2 && /^[A-Z]+$/i.test(w));
    const validName = nameWords.length >= 2 ? nameWords.join(' ').toUpperCase() : '';

    console.log('[ID_PARSER_SPATIAL] Extracted name:', validName);

    if (!validName || !dob.value) {
        console.log('[ID_PARSER_SPATIAL] Failed - falling back to text-only parsing');
        return parseIDCardData(text);
    }

    // Calculate age from DOB
    const isAdult = calculateAge(dob.value) >= 18;
    console.log('[ID_PARSER_SPATIAL] Age verification:', isAdult ? '18+' : 'Under 18');

    return {
        name: validName,
        dateOfBirth: dob.value,
        idNumber: idNumber.value || undefined,
        confidence: 90,
        isAdult,
    };
}

/**
 * Parse OCR text and extract structured data for Australian ID cards (TEXT-ONLY FALLBACK)
 */
export function parseIDCardData(text: string): ScannedData | null {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    const name = extractName(lines);
    const dob = extractDateOfBirth(lines);
    const idNumber = extractIDNumber(lines);

    // Calculate overall confidence based on what we found
    let confidence = 0;
    if (name.value) confidence += 40;
    if (dob.value) confidence += 40;
    if (idNumber.value) confidence += 20;

    // Need at least name and DOB to be valid
    if (!name.value || !dob.value) {
        return null;
    }

    // Calculate age from DOB
    const isAdult = calculateAge(dob.value) >= 18;

    return {
        name: name.value,
        dateOfBirth: dob.value,
        idNumber: idNumber.value || undefined,
        confidence: Math.min(confidence, 100),
        isAdult,
    };
}

/**
 * Extract name from OCR text
 * For Victoria driver's licenses, the name appears as a standalone all-caps line
 * below the blue header (which contains "VICTORIA" and "DRIVER LICENCE")
 */
function extractName(lines: string[]): ParseResult {
// Common words/phrases to exclude (ID card labels, not names)
    const excludeList = [
        'DRIVER LICENCE',
        'DRIVER LICENSE',
        'DRIVERS LICENCE',
        'DRIVERS LICENSE',
        'VICTORIA',
        'VICTORIAN',
        'VICTORIA AUSTRALIA',
        'AUSTRALIAN',
        'AUSTRALIA',
        'GOVERNMENT',
        'CARD NUMBER',
        'LICENSE NUMBER',
        'LICENCE NUMBER',
        'LICENSE NO.',
        'LICENCE NO.',
        'DATE OF BIRTH',
        'EXPIRY DATE',
        'ISSUE DATE',
        'EXPIRY',
        'LICENCE EXPIRY',
        'LICENSE EXPIRY',
        'LICENCE TYPE',
        'LICENSE TYPE',
        'ADDRESS',
        'RESTRICTIONS',
        'CONDITIONS',
        'CLASS',
        'SIGNATURE',
        'PHOTO',
        'CARD',
        // License class codes
        'CAR',
        'MOTORCYCLE',
        'TRUCK',
        'BUS',
        'HEAVY',
        'LIGHT',
        'MEDIUM',
        'RIDER',
        // Common condition codes (these often appear as random letter combinations)
        'CONDITION',
        'RESTRICTION',
    ];

    console.log('[ID_PARSER] Extracting name from', lines.length, 'lines');

    // Pattern 1: Look for explicit name labels (rare on Victoria licenses)
    const labeledNamePattern = /(?:NAME|SURNAME|GIVEN\s*NAMES?)[:\s]+([A-Z][A-Z\s]+)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(labeledNamePattern);
        if (match && match[1]) {
            const name = match[1].trim();
            if (isValidName(name) && !isExcluded(name, excludeList)) {
                console.log('[ID_PARSER] Found labeled name:', name);
                return { value: name, confidence: 90 };
            }
        }
    }

    // Pattern 1.5: Handle multi-line names (e.g., "JANE" on one line, "CITIZEN" on next)
    // Common on Victoria licenses where given name and surname are on separate lines
    for (let i = 0; i < lines.length - 1; i++) {
        const line1 = lines[i].trim();
        const line2 = lines[i + 1].trim();

        // Check if both lines are single-word all-caps
        const isSingleWordCaps1 = /^[A-Z]{2,}$/.test(line1);
        const isSingleWordCaps2 = /^[A-Z]{2,}$/.test(line2);

        if (isSingleWordCaps1 && isSingleWordCaps2) {
            const combinedName = `${line1} ${line2}`;

            // Check if the combined name is valid and not excluded
            if (isValidName(combinedName) &&
                !isExcluded(line1, excludeList) &&
                !isExcluded(line2, excludeList) &&
                !isExcluded(combinedName, excludeList)) {
                console.log('[ID_PARSER] Found multi-line name:', line1, '+', line2, '=', combinedName);
                return { value: combinedName, confidence: 95 };
            }
        }
    }

    // Pattern 2: Contextual scoring for all-caps lines
    // Score candidates based on position and context rather than rigid rules
    const candidates: Array<{
        value: string;
        lineIndex: number;
        wordCount: number;
        score: number;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();

        // Must be all caps, reasonable length
        if (/^[A-Z\s]+$/.test(trimmedLine) && trimmedLine.length >= 4 && trimmedLine.length <= 50) {
            const words = trimmedLine.split(/\s+/).filter(w => w.length > 0);

            // Must have at least 2 words and basic validation
            if (words.length >= 2 && isValidName(trimmedLine) && !isExcluded(trimmedLine, excludeList)) {

                // Calculate contextual score
                let score = 100;

                // Prefer lines that appear after "DRIVER LICENCE" or "VICTORIA" (likely headers)
                const hasHeaderBefore = lines.slice(0, i).some(line =>
                    /DRIVER|LICENCE|LICENSE|VICTORIA/i.test(line)
                );
                if (hasHeaderBefore) score += 30;

                // Penalize very early lines (likely headers themselves)
                if (i < 2) score -= 40;

                // Prefer 2-word names (typical first + last)
                if (words.length === 2) score += 20;
                if (words.length === 3) score += 10;

                // Prefer lines that appear before "DATE OF BIRTH" or numbers (likely data fields)
                const hasDataAfter = lines.slice(i + 1).some(line =>
                    /DATE|BIRTH|ADDRESS|EXPIRY|\d{2}[-\/]\d{2}[-\/]\d{4}/i.test(line)
                );
                if (hasDataAfter) score += 20;

                // Prefer earlier positions (name usually appears near top)
                if (i >= 2 && i <= 5) score += 15;

                candidates.push({
                    value: trimmedLine,
                    lineIndex: i,
                    wordCount: words.length,
                    score: score
                });

                console.log('[ID_PARSER] Candidate:', trimmedLine, 'at line', i, 'score:', score);
            }
        }
    }

    // Pick the highest scoring candidate
    if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];
        console.log('[ID_PARSER] Selected best candidate:', best.value, 'with score:', best.score);
        return { value: best.value, confidence: Math.min(85, 50 + best.score / 4) };
    }

    // Pattern 3: Look for Title Case names (e.g., "Jane Citizen")
    for (const line of lines) {
        const words = line.split(/\s+/).filter(w => /^[A-Z][a-z]+$/.test(w));
        if (words.length >= 2) {
            const name = words.join(' ');
            if (isValidName(name) && !isExcluded(name, excludeList)) {
                console.log('[ID_PARSER] Found title case name:', name);
                return { value: name.toUpperCase(), confidence: 70 };
            }
        }
    }

    console.log('[ID_PARSER] No valid name found');
    return { value: '', confidence: 0 };
}

/**
 * Check if a string is a valid name
 * Uses simple, flexible validation rather than rigid linguistic rules
 */
function isValidName(name: string): boolean {
    const trimmed = name.trim();

    // Length check: reasonable name length
    if (trimmed.length < 2 || trimmed.length > 50) return false;

    // Must contain only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(trimmed)) return false;

    // Must have at least 2 words (first + last name)
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) return false;

    // Each word should be at least 2 characters
    if (words.some(w => w.length < 2)) return false;

    // Simple heuristic: real names usually have vowels
    // This catches obvious non-names like "XYZ" or "BCDFG" without being too strict
    const hasVowels = /[AEIOU]/i.test(trimmed);
    if (!hasVowels) {
        console.log('[ID_PARSER] Rejected (no vowels):', trimmed);
        return false;
    }

    return true;
}

/**
 * Check if a name matches any excluded terms
 */
function isExcluded(name: string, excludeList: string[]): boolean {
    const upperName = name.toUpperCase().trim();

    for (const excluded of excludeList) {
        if (upperName === excluded || upperName.includes(excluded)) {
            return true;
        }
    }

    return false;
}

/**
 * Extract date of birth from OCR text
 * Supports formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
 */
function extractDateOfBirth(lines: string[]): ParseResult {
    const dobPatterns = [
        /(?:DOB|DATE\s*OF\s*BIRTH|BORN)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,  // Any date pattern
        /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,  // ISO format
    ];

    for (const line of lines) {
        for (const pattern of dobPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                const dateStr = match[1];
                const normalized = normalizeDateFormat(dateStr);
                if (normalized && isValidDate(normalized)) {
                    return { value: normalized, confidence: 90 };
                }
            }
        }
    }

    return { value: '', confidence: 0 };
}

/**
 * Extract ID number from OCR text
 */
function extractIDNumber(lines: string[]): ParseResult {
    const idPatterns = [
        /(?:ID\s*NO|LICENSE\s*NO|CARD\s*NO|NUMBER)[:\s]+([A-Z0-9\s\-]+)/i,
        /([A-Z]{2}\d{6,10})/,  // Common Australian ID format
        /(\d{8,10})/,  // Numeric ID
    ];

    for (const line of lines) {
        for (const pattern of idPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                const idNum = match[1].trim().replace(/\s+/g, '');
                if (idNum.length >= 6 && idNum.length <= 15) {
                    return { value: idNum, confidence: 70 };
                }
            }
        }
    }

    return { value: '', confidence: 0 };
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDateFormat(dateStr: string): string | null {
    // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const ddmmyyyyMatch = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const yyyymmddMatch = dateStr.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (yyyymmddMatch) {
        const [, year, month, day] = yyyymmddMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
}

/**
 * Validate that a date string is a valid date
 */
function isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return false;
    }

    // Check if date is not in the future
    if (date > new Date()) {
        return false;
    }

    // Check if date is not more than 120 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (date < minDate) {
        return false;
    }

    // Check if person is at least 18 years old
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (date > eighteenYearsAgo) {
        return false;
    }

    return true;
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
