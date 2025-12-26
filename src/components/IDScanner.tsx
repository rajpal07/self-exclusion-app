'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface IDScannerProps {
    onClose: () => void;
    onScanComplete: (data: { name: string; dateOfBirth: string; isAdult?: boolean }) => void;
}

export default function IDScanner({ onClose, onScanComplete }: IDScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);

    // Debug state
    const [debugInfo, setDebugInfo] = useState<{
        nameImage?: string;
        dobImage?: string;
        debugImage?: string; // New field for visualization
        nameText?: string;
        dobText?: string;
        nameConfidence?: number;
        dobConfidence?: number;
        validatedName?: string;
        validatedDob?: string;
        step?: string;
    }>({});

    // Add state for review
    const [scanResult, setScanResult] = useState<{
        name: string;
        dateOfBirth: string;
        isAdult: boolean;
        confidence: number;
    } | null>(null);

    // Start camera when component mounts
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please grant camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current || !overlayRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const overlay = overlayRef.current;

        if (!context) return;

        const videoRect = video.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const elementWidth = videoRect.width;
        const elementHeight = videoRect.height;

        const videoAspect = videoWidth / videoHeight;
        const elementAspect = elementWidth / elementHeight;

        let scale: number, offsetX: number, offsetY: number;

        if (videoAspect > elementAspect) {
            scale = videoHeight / elementHeight;
            const visibleSrcWidth = elementWidth * scale;
            offsetX = (videoWidth - visibleSrcWidth) / 2;
            offsetY = 0;
        } else {
            scale = videoWidth / elementWidth;
            const visibleSrcHeight = elementHeight * scale;
            offsetX = 0;
            offsetY = (videoHeight - visibleSrcHeight) / 2;
        }

        const relOverlayX = overlayRect.left - videoRect.left;
        const relOverlayY = overlayRect.top - videoRect.top;

        const captureX = offsetX + (relOverlayX * scale);
        const captureY = offsetY + (relOverlayY * scale);
        const captureW = overlayRect.width * scale;
        const captureH = overlayRect.height * scale;

        canvas.width = 1024;
        canvas.height = 640;

        context.drawImage(
            video,
            captureX, captureY, captureW, captureH,
            0, 0, 1024, 640
        );

        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);

        stopCamera();

        await processImage(canvas);
    };

    const processImage = async (canvas: HTMLCanvasElement) => {
        setIsProcessing(true);
        setError(null);

        try {
            setDebugInfo({ step: 'Sending to AI for analysis...' });

            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // Use Groq LLM for OCR
            const { performOCR } = await import('@/utils/ocr');
            const result = await performOCR(imageData);

            console.log('📝 AI OCR Result:', result);

            setDebugInfo(prev => ({
                ...prev,
                nameText: result.name || 'Not found',
                validatedName: result.name || undefined,
                validatedDob: result.dateOfBirth || undefined,
                nameConfidence: result.confidence,
                step: 'Analysis Complete'
            }));

            if (result.name && result.dateOfBirth) {
                // Show result for review
                setScanResult({
                    name: result.name,
                    dateOfBirth: result.dateOfBirth,
                    isAdult: result.isAdult || false,
                    confidence: result.confidence
                });
            } else {
                const msg = `Low confidence analysis. Name: ${result.name || '?'}, DOB: ${result.dateOfBirth || '?'}`;
                console.error('⚠️ LOW CONFIDENCE:', msg);
                handleScanFailure('Could not clearly read details. Please try again or enter manually.');
            }

        } catch (err) {
            console.error('💥 ERROR:', err);
            setDebugInfo({ step: 'Error: ' + (err instanceof Error ? err.message : 'Unknown') });
            handleScanFailure('Processing error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScanFailure = (msg?: string) => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
            setError(msg + ' Please enter details manually.');
            setTimeout(() => {
                onClose();
            }, 3000);
        } else {
            setError(msg || `Scan failed. Please ensure text is clear. (Attempt ${newAttempts}/3)`);
            setTimeout(() => {
                retake();
            }, 2000);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        setScanResult(null);
        setError(null);
        startCamera();
    };

    const confirmScan = () => {
        if (scanResult) {
            onScanComplete({
                name: scanResult.name,
                dateOfBirth: scanResult.dateOfBirth,
                isAdult: scanResult.isAdult,
            });
        }
    };

    // Review Screen
    if (scanResult && capturedImage) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                    <img
                        src={capturedImage}
                        alt="Captured ID"
                        className="max-h-full max-w-full object-contain opacity-50"
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl mx-4 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-xl">📋</span> Review Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                                    <div className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-1">
                                        {scanResult.name}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                                    <div className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-1">
                                        {scanResult.dateOfBirth}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${scanResult.isAdult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {scanResult.isAdult ? '18+ ADULT' : 'UNDERAGE'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Confidence: {scanResult.confidence}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={retake}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={confirmScan}
                                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <h2 className="text-xl font-bold text-white">Scan ID Card</h2>
                <button
                    onClick={onClose}
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="relative h-full w-full bg-black flex items-center justify-center">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div
                                ref={overlayRef}
                                className="relative h-[250px] w-[400px] rounded-lg border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                            >
                                <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-white"></div>
                                <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-white"></div>
                                <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-white"></div>
                                <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-white"></div>
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-center text-sm text-white/80 font-medium">
                                        Align card within frame
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <img
                        src={capturedImage}
                        alt="Captured ID"
                        className="max-h-full max-w-full object-contain"
                    />
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {error && (
                <div className="absolute left-4 right-4 top-20 z-20 rounded-lg bg-red-600 p-4 text-center text-white shadow-lg animate-in fade-in slide-in-from-top-4">
                    {error}
                </div>
            )}

            {isProcessing && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="rounded-lg bg-white p-6 text-center shadow-xl">
                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 mx-auto"></div>
                        <p className="text-lg font-semibold text-gray-900">Processing...</p>
                        <p className="text-sm text-gray-600">Extracting details</p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-8">
                {!capturedImage ? (
                    <button
                        onClick={captureImage}
                        disabled={!stream || isProcessing}
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg hover:bg-gray-100 disabled:opacity-50 ring-4 ring-white/30 transition-all active:scale-95"
                    >
                        <Camera className="h-8 w-8" />
                    </button>
                ) : null}
            </div>

            {/* Debug Panel - Show what OCR sees */}
            {/* COMMENTED OUT - Not visible during processing anyway
            {capturedImage && (
                <div className="absolute left-2 right-2 bottom-32 z-20 max-h-96 overflow-y-auto bg-black/95 backdrop-blur-sm p-3 text-white text-xs rounded-lg border border-yellow-500">
                    <div className="mb-2 font-bold text-yellow-400 text-sm">🔍 DEBUG VISUALIZATION (Full Frame OCR)</div>

                    {debugInfo.debugImage ? (
                        <div className="mb-3 p-2 bg-gray-900 rounded">
                            <div className="text-white font-bold mb-1">FULL CARD IMAGE:</div>
                            <img src={debugInfo.debugImage} alt="Full Card" className="border border-white/50 mb-1 w-full" />
                            <div className="text-gray-400 text-[10px]">Entire card sent to Google Cloud Vision</div>
                        </div>
                    ) : (
                        <div className="mb-3 p-2 bg-gray-900 rounded text-gray-400">
                            Waiting for image capture...
                        </div>
                    )}

                    {debugInfo.nameText && (
                        <div className="mb-3 p-2 bg-gray-900 rounded">
                            <div className="text-green-400 font-bold mb-1">FULL OCR TEXT:</div>
                            <div className="text-xs text-yellow-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto border border-gray-700 p-2 rounded bg-black/50">
                                {debugInfo.nameText}
                            </div>
                            <div className="text-gray-400 text-[10px] mt-1">
                                Confidence: {debugInfo.nameConfidence}% | Length: {debugInfo.nameText.length} chars
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-gray-900 rounded">
                            <div className="text-green-400 font-bold mb-1">PARSED NAME:</div>
                            <div className="text-yellow-300 break-all">
                                {debugInfo.validatedName || 'Not found'}
                            </div>
                        </div>

                        <div className="p-2 bg-gray-900 rounded">
                            <div className="text-blue-400 font-bold mb-1">PARSED DOB:</div>
                            <div className="text-yellow-300 break-all">
                                {debugInfo.validatedDob || 'Not found'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                        Status: {debugInfo.step}
                    </div>
                </div>
            )}
            */}
        </div>
    );
}
