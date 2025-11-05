import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editImage } from "@/lib/gemini-analyzer-social-service";
import { fileToBase64 } from "@/utils/fileUtils";
import { Loader } from "./common/Loader";

export const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setEditedImageUrl(null);
            setError(null);
        }
    };

    const handleEdit = async () => {
        if (!(imageFile && prompt.trim())) {
            setError("Please upload an image and provide an editing instruction.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);
        try {
            const imageBase64 = await fileToBase64(imageFile);
            // Fix: Pass the image data as an object, which is the expected type for the `editImage` function's second parameter.
            const url = await editImage(prompt, {
                base64: imageBase64,
                mimeType: imageFile.type,
            });
            setEditedImageUrl(url);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred during image editing."
            );
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-white mb-4">
                    Image Editor with Gemini Flash Image
                </h2>
                <p className="text-gray-400 mb-4">
                    Upload an image and describe the changes you want to make.
                </p>
                <div className="space-y-4">
                    <div>
                        <Label
                            htmlFor="image-upload"
                            className="block text-sm font-medium text-gray-300 mb-2">
                            1. Upload Image
                        </Label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 w-full text-gray-400"
                            disabled={isLoading}
                        />
                    </div>
                    {imagePreview && (
                        <div>
                            <Label
                                htmlFor="edit-prompt"
                                className="block text-sm font-medium text-gray-300 mb-2">
                                2. Describe Your Edit
                            </Label>
                            <Input
                                id="edit-prompt"
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="e.g., Add a retro filter, remove the background"
                                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                disabled={isLoading || !imagePreview}
                            />
                        </div>
                    )}
                </div>
                <Button
                    onClick={handleEdit}
                    isLoading={isLoading}
                    disabled={isLoading || !imageFile || !prompt}
                    className="mt-6 w-full sm:w-auto">
                    Edit Image
                </Button>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader size="h-10 w-10" />
                    <p className="ml-4 text-lg text-gray-300">Applying your edits...</p>
                </div>
            )}

            {error && (
                <Card>
                    <p className="text-red-400" role="alert">
                        Error: {error}
                    </p>
                </Card>
            )}

            {(imagePreview || editedImageUrl) && (
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {imagePreview && (
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-indigo-400 mb-4">
                                    Original Image
                                </h3>
                                <Image
                                    width={100}
                                    height={100}
                                    src={imagePreview}
                                    alt="Original upload"
                                    className="rounded-lg w-full max-w-lg mx-auto shadow-lg"
                                />
                            </div>
                        )}
                        {editedImageUrl && (
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-indigo-400 mb-4">
                                    Edited Image
                                </h3>
                                <Image
                                    width={100}
                                    height={100}
                                    src={editedImageUrl}
                                    alt={prompt}
                                    className="rounded-lg w-full max-w-lg mx-auto shadow-lg"
                                />
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};
