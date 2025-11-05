import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeVideoFrames } from "@/lib/gemini-analyzer-social-service";
import { fileToBase64 } from "@/utils/fileUtils";
import { Loader } from "./common/Loader";

const MAX_FRAMES = 16;

export const VideoAnalyzer: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>(
        "Summarize what is happening in this video."
    );
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setResult(null);
            setError(null);
        }
    };

    const extractFrames = async (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            if (!(videoRef.current && canvasRef.current && videoFile)) {
                return reject(new Error("Video or canvas element not available."));
            }
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (!context) {
                return reject(new Error("Could not get canvas context."));
            }

            const frames: string[] = [];
            video.src = URL.createObjectURL(videoFile);

            video.onloadeddata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const duration = video.duration;
                const interval = duration / MAX_FRAMES;
                let currentTime = 0;
                let framesExtracted = 0;

                const seekAndCapture = () => {
                    if (framesExtracted >= MAX_FRAMES) {
                        video.src = "";
                        resolve(frames);
                        return;
                    }
                    setProgress(`Extracting frame ${framesExtracted + 1} of ${MAX_FRAMES}...`);
                    video.currentTime = currentTime;
                };

                video.onseeked = () => {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        async blob => {
                            if (blob) {
                                const base64Frame = await fileToBase64(
                                    new File([blob], "frame.jpg", { type: "image/jpeg" })
                                );
                                frames.push(base64Frame);
                            }
                            framesExtracted++;
                            currentTime += interval;
                            seekAndCapture();
                        },
                        "image/jpeg",
                        0.8
                    );
                };

                seekAndCapture();
            };

            video.onerror = _e => {
                reject(new Error("Error loading video."));
            };
        });
    };

    const handleAnalyze = async () => {
        if (!(videoFile && prompt.trim())) {
            setError("Please select a video file and enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgress("Preparing video...");
        try {
            const frames = await extractFrames();
            setProgress("Sending frames to Gemini for analysis...");
            const analysisResult = await analyzeVideoFrames(prompt, frames);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-white mb-4">
                    Video Analysis with Gemini Pro
                </h2>
                <p className="text-gray-400 mb-4">
                    Upload a video and provide a prompt. The tool will extract frames and use Gemini
                    Pro to analyze the visual content.
                </p>
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 w-full text-gray-400"
                        disabled={isLoading}
                    />
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., Describe the main objects and their interactions."
                        className="w-full h-24 p-3 bg-gray-900/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                </div>
                <Button
                    onClick={handleAnalyze}
                    isLoading={isLoading}
                    disabled={isLoading || !videoFile}
                    className="mt-4 w-full sm:w-auto">
                    Analyze Video
                </Button>
                <video ref={videoRef} className="hidden" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader size="h-10 w-10" />
                    <p className="ml-4 text-lg text-gray-300">{progress || "Processing..."}</p>
                </div>
            )}

            {error && (
                <Card>
                    <p className="text-red-400">Error: {error}</p>
                </Card>
            )}

            {result && (
                <Card>
                    <h3 className="text-lg font-semibold text-indigo-400 mb-2">Analysis Result</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
                </Card>
            )}
        </div>
    );
};
