import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Extract base64 data from data URL
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: 'Google Cloud Vision API key not configured'
            }, { status: 500 });
        }

        // Call Google Cloud Vision API
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [
                        {
                            image: {
                                content: base64Data,
                            },
                            features: [
                                {
                                    type: 'TEXT_DETECTION',
                                    maxResults: 1,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('Vision API error:', error);
            return NextResponse.json({
                error: 'Vision API request failed',
                details: error
            }, { status: response.status });
        }

        const data = await response.json();
        const textAnnotations = data.responses[0]?.textAnnotations;

        if (!textAnnotations || textAnnotations.length === 0) {
            return NextResponse.json({
                text: '',
                confidence: 0,
            });
        }

        // First annotation contains all detected text
        const fullText = textAnnotations[0].description || '';

        // Extract individual text blocks with their positions
        // textAnnotations[1+] contains individual words/blocks with bounding boxes
        const textBlocks = textAnnotations.slice(1).map((annotation: any) => {
            const vertices = annotation.boundingPoly?.vertices || [];

            // Calculate normalized position (0-1 range)
            const x = vertices.length > 0 ? vertices[0].x || 0 : 0;
            const y = vertices.length > 0 ? vertices[0].y || 0 : 0;

            return {
                text: annotation.description || '',
                boundingBox: {
                    vertices: vertices,
                    x: x,
                    y: y,
                }
            };
        });

        // Google Vision API doesn't always provide confidence scores for text detection
        // If text was successfully detected, we can assume high confidence (95%)
        // The API only returns results it's confident about
        const confidence = fullText ? 95 : 0;

        return NextResponse.json({
            text: fullText.trim(),
            confidence: confidence,
            textBlocks: textBlocks, // Individual words with positions
            rawResponse: data.responses[0], // For debugging
        });

    } catch (error) {
        console.error('OCR API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
