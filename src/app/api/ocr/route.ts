
import { NextRequest, NextResponse } from 'next/server';
import groq from '@/lib/groq';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Image data is required' },
                { status: 400 }
            );
        }

        const systemPrompt = `You are an expert ID document analyzer. 
    Your task is to extract specific information from the provided ID card image.
    
    EXTRACT ONLY:
    1. Name (Full Name)
    2. Date of Birth (DOB) - Format: YYYY-MM-DD
    3. ID Number (License Number or Card Number)
    
    OUTPUT FORMAT:
    Return a valid JSON object strictly matching this schema:
    {
      "name": "string or null",
      "dateOfBirth": "string (YYYY-MM-DD) or null",
      "idNumber": "string or null",
      "confidence": number (0-100)
    }
    
    GUIDELINES:
    - Do NOT hallucinate. If a field is illegible or missing, set it to null.
    - If the image is not an ID card, return null for all fields and 0 confidence.
    - Confidence should reflect the clarity and legibility of the text.
    - Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
    `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this ID card image and extract the required information.',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: image, // Expecting base64 data URL
                            },
                        },
                    ],
                },
            ],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            // temperature: 0.1, // Low temperature for deterministic output
            // max_tokens: 512,
            top_p: 1,
            stream: false,
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from LLM');
        }

        let parsedResult;
        try {
            parsedResult = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse LLM response:', content);
            throw new Error('Invalid JSON response from LLM');
        }

        return NextResponse.json(parsedResult);

    } catch (error) {
        console.error('OCR API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}
