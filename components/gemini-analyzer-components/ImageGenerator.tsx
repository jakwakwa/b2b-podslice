import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateImage, isImageGenerationEnabled } from "@/lib/gemini-analyzer-social-service";
import { Loader } from "./common/Loader";

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate an image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            // generateImage will automatically simulate if image generation is disabled
            const url = await generateImage(prompt);
            setImageUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const imageGenEnabled = isImageGenerationEnabled();

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-white mb-4">
                    Image Generation with Imagen 4
                </h2>
                {!imageGenEnabled && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
                        <p className="text-yellow-400 text-sm">
                            ℹ️ Image generation is disabled. Placeholder images will be shown. Set NEXT_PUBLIC_IMAGEN_ENABLED=true to enable real image generation.
                        </p>
                    </div>
                )}
                <p className="text-gray-400 mb-4">
                    Describe the image you want to create. Be as specific or creative as you like.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        id="image-prompt"
                        type="text"
                        name="image-prompt"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., A cinematic shot of a raccoon astronaut on Mars"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        disabled={isLoading || !prompt}
                        className="w-full sm:w-auto">
                        {imageGenEnabled ? "Generate" : "Generate (Simulated)"}
                    </Button>
                </div>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader size="h-10 w-10" />
                    <p className="ml-4 text-lg text-gray-300">Generating your image...</p>
                </div>
            )}

            {error && (
                <Card>
                    <p className="text-red-400">Error: {error}</p>
                </Card>
            )}

            {imageUrl && (
                <Card>
                    <h3 className="text-lg font-semibold text-indigo-400 mb-4">Generated Image</h3>
                    <Image
                        width={100}
                        height={100}
                        src={imageUrl}
                        alt={prompt}
                        className="rounded-lg w-full max-w-lg mx-auto shadow-lg"
                    />
                </Card>
            )}
        </div>
    );
};
