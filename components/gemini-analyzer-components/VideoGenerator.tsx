import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVeoApiKey } from "@/hooks/useVeoApiKey";
import type { AspectRatio } from "@/lib/db.types";
import { generateVideoFromImage } from "@/lib/gemini-analyzer-social-service";
import { fileToBase64 } from "@/utils/fileUtils";
import { Loader } from "./common/Loader";

export const VideoGenerator: React.FC = () => {
    const { isKeyReady, isChecking, keyError, selectApiKey, handleApiError } =
        useVeoApiKey();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setVideoUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!(imageFile && prompt.trim())) {
            setError("Please upload an image and provide a prompt.");
            return;
        }
        setloading(true);
        setError(null);
        setVideoUrl(null);
        setProgress("Preparing assets...");
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const url = await generateVideoFromImage(
                prompt,
                imageBase64,
                imageFile.type,
                aspectRatio,
                setProgress
            );
            setVideoUrl(url);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            if (errorMessage.includes("API key error")) {
                handleApiError();
            }
            console.error(err);
        } finally {
            setloading(false);
            setProgress(null);
        }
    };

    if (isChecking) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader size="h-8 w-8" />
                <p className="ml-4">Checking API Key...</p>
            </div>
        );
    }

    if (!isKeyReady || keyError) {
        return (
            <Card className="text-center">
                <h2 className="text-xl font-bold text-white mb-4">
                    Veo Video Generation Requires an API Key
                </h2>
                <p className="text-gray-400 mb-4">
                    To generate videos, you must select an API key associated with a project that
                    has billing enabled.
                </p>
                <p className="text-gray-500 text-sm mb-4">
                    For more information, see the{" "}
                    <a
                        href="https://ai.google.dev/gemini-api/docs/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline">
                        billing documentation
                    </a>
                    .
                </p>
                {keyError && <p className="text-red-400 mb-4">{keyError}</p>}
                <Button onClick={selectApiKey}>Select API Key</Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-white mb-4">Video Generation with Veo</h2>
                <p className="text-gray-400 mb-4">
                    Upload a starting image, describe the scene, and let Veo generate a short video.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="mt-2 gap-3 flex flex-col">
                        <div>
                            <Label
                                htmlFor="image-upload"
                                className="block text-sm font-medium text-gray-300 mb-2">
                                1. Upload Starting Image
                            </Label>
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 w-full text-gray-400"
                                disabled={loading}
                            />
                        </div>
                        {imagePreview && (
                            <div className="mt-4">
                                <Image
                                    src={imagePreview}
                                    alt="Image preview"
                                    className="rounded-lg max-h-48 w-auto shadow-md"
                                    width={192}
                                    height={192}
                                />
                            </div>
                        )}
                    </div>
                    <div className="mt-2 gap-3 flex flex-col">
                        <div>
                            <Label
                                htmlFor="video-description"
                                className="block text-sm font-medium text-gray-300 mb-2">
                                2. Describe the Video
                            </Label>
                            <Textarea
                                id="video-description"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="e.g., The camera slowly zooms out to reveal a bustling futuristic city"
                                className="w-full h-24 p-3 bg-gray-900/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="aspect-ratio"
                                className="block text-sm font-medium text-gray-300 mb-2">
                                3. Select Aspect Ratio
                            </Label>
                            <Select
                                value={aspectRatio}
                                onValueChange={value => setAspectRatio(value as AspectRatio)}
                                disabled={loading}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select aspect ratio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={loading || !imageFile || !prompt}
                    className="mt-6 w-full sm:w-auto">
                    Generate Video
                </Button>
            </Card>

            {loading && (
                <Card className="text-center">
                    <div className="flex flex-col items-center p-4">
                        <Loader size="h-10 w-10" />
                        <p className="mt-4 text-lg text-gray-300">
                            {progress || "Starting generation..."}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Video generation can take several minutes. Please stay on this page.
                        </p>
                    </div>
                </Card>
            )}

            {error && (
                <Card>
                    <p className="text-red-400">Error: {error}</p>
                </Card>
            )}

            {videoUrl && (
                <Card>
                    <h3 className="text-lg font-semibold text-indigo-400 mb-4">Generated Video</h3>
                    <video
                        controls
                        autoPlay
                        loop
                        src={videoUrl}
                        className="rounded-lg w-full max-w-2xl mx-auto shadow-lg bg-black"
                        width={100}
                        height={100}>
                        <track kind="captions" />
                    </video>
                </Card>
            )}
        </div>
    );
};
