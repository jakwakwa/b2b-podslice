"use client";
import { type FC, useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PodcastAnalysisResult } from "@/lib/db.types";
import { formatErrorForDisplay } from "@/lib/error-utils";
import {
    analyzePodcastContent,
    editImage,
    generateImage,
    generateSocialMediaPosts,
    isImageGenerationEnabled,
} from "@/lib/gemini-analyzer-social-service";
import { fileToBase64 } from "@/utils/fileUtils";
import { Textarea } from "../ui/textarea";
import { Loader } from "./common/Loader";
import { SocialMediaPreview } from "./SocialMediaPreview";

export const PodcastAnalyzer: FC = () => {
    const [transcript, setTranscript] = useState("");
    const [result, setResult] = useState<PodcastAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editedChapters, setEditedChapters] = useState<
        { timestamp: string; title: string }[]
    >([]);
    const [isRegeneratingSocialMedia, setIsRegeneratingSocialMedia] = useState(false);
    const [socialMediaError, setSocialMediaError] = useState<string | null>(null);
    const [socialMediaTone, setSocialMediaTone] = useState("");
    const [progress, setProgress] = useState<string | null>(null);

    // State for inline image editing
    const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null);
    const [editPrompt, setEditPrompt] = useState("");
    const [editGuideImage, setEditGuideImage] = useState<File | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [imageEditError, setImageEditError] = useState<string | null>(null);

    // State for error dialog
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogData, setErrorDialogData] = useState<{
        title: string;
        message: string;
        action: string;
        icon: string;
    } | null>(null);

    // State for model selection
    const [useLiteModel, setUseLiteModel] = useState(false);

    useEffect(() => {
        if (result?.chapters) {
            setEditedChapters(result.chapters);
        }
    }, [result?.chapters]);

    // Reset to Pro model on component unmount (navigation away)
    useEffect(() => {
        return () => {
            setUseLiteModel(false);
        };
    }, []);

    const showErrorDialog = (error: unknown) => {
        const formattedError = formatErrorForDisplay(error);
        setErrorDialogData(formattedError);
        setErrorDialogOpen(true);
    };

    const handleReset = () => {
        setTranscript("");
        setResult(null);
        setError(null);
        setSocialMediaError(null);
        setEditedChapters([]);
        setSocialMediaTone("");
        setProgress(null);
        setErrorDialogOpen(false);
        setErrorDialogData(null);
        setUseLiteModel(false); // Reset to Pro model
    };

    const handleAnalyze = async () => {
        if (!transcript.trim()) {
            setError("Please enter a podcast transcript.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        setSocialMediaError(null);
        setProgress("Preparing for analysis...");
        try {
            // Step 1: Get summary and chapters
            const baseResult = await analyzePodcastContent(transcript, setProgress, useLiteModel);

            const validationErrors: string[] = [];
            if (!baseResult?.summary?.trim()) {
                validationErrors.push("could not generate summary");
            }
            if (!baseResult?.chapters || baseResult.chapters.length === 0) {
                validationErrors.push("could not identify chapters");
            }

            let accumulatedError = "";
            if (validationErrors.length > 0) {
                accumulatedError = `Analysis completed with issues: ${validationErrors.join(", ")}.`;
                setError(accumulatedError);
            }

            const initialResult: PodcastAnalysisResult = {
                summary: baseResult.summary || "",
                chapters: baseResult.chapters || [],
                socialMediaPosts: [], // Initialize with empty posts
            };
            setResult(initialResult);

            // Step 2: Generate social media posts if the first step was successful
            if (initialResult.summary && initialResult.chapters.length > 0) {
                try {
                    setProgress("Generating social media posts...");
                    const textPosts = await generateSocialMediaPosts(
                        initialResult.summary,
                        initialResult.chapters,
                        undefined,
                        useLiteModel
                    );

                    // Set text posts first for responsiveness
                    const postsWithImagePlaceholders = textPosts.map(post => ({
                        ...post,
                        imageUrl: undefined,
                    }));
                    setResult(prev =>
                        prev ? { ...prev, socialMediaPosts: postsWithImagePlaceholders } : null
                    );

                    // Step 3: Asynchronously generate images for each post
                    // (will simulate with placeholders if image generation is disabled)
                    const imageGenEnabled = isImageGenerationEnabled();
                    setProgress(
                        imageGenEnabled
                            ? "Generating images for social media posts..."
                            : "Simulating images for social media posts..."
                    );
                    textPosts.forEach(async (post, index) => {
                        try {
                            const imageUrl = await generateImage(
                                `A professional, visually appealing graphic for a social media post about a podcast. The post says: "${post.content}"`
                            );
                            setResult(prev => {
                                if (!prev) return null;
                                const newPosts = [...prev.socialMediaPosts];
                                if (newPosts[index]) {
                                    newPosts[index] = { ...newPosts[index], imageUrl };
                                }
                                return { ...prev, socialMediaPosts: newPosts };
                            });
                        } catch (err) {
                            console.error(`Failed to generate image for post at index ${index}:`, err);
                        }
                    });
                } catch (err) {
                    const socialError =
                        err instanceof Error ? err.message : "An unknown error occurred.";
                    const combinedError =
                        `${accumulatedError} Failed to generate social media posts: ${socialError}`.trim();
                    setError(combinedError);
                    showErrorDialog(err);
                }
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred during analysis.";
            setError(`Analysis failed: ${errorMessage}`);
            showErrorDialog(err);
            console.error(err);
        } finally {
            setIsLoading(false);
            setProgress(null);
            // Don't reset useLiteModel here - let user decide via dialog or reset button
        }
    };

    const handleChapterChange = (
        index: number,
        field: "timestamp" | "title",
        value: string
    ) => {
        setEditedChapters(prev =>
            prev.map((chapter, i) => (i === index ? { ...chapter, [field]: value } : chapter))
        );
    };

    const handleRegenerateSocialMedia = async () => {
        if (!result?.summary || editedChapters.length === 0) {
            setSocialMediaError(
                "Summary and chapters are required to regenerate social media posts."
            );
            return;
        }

        setIsRegeneratingSocialMedia(true);
        setSocialMediaError(null);
        try {
            // Step 1: Generate text posts only
            const newTextPosts = await generateSocialMediaPosts(
                result.summary,
                editedChapters,
                socialMediaTone,
                useLiteModel
            );

            if (!newTextPosts || newTextPosts.length === 0) {
                throw new Error(
                    "The model did not return any social media posts. Please try adjusting the tone."
                );
            }

            // Step 2: Update UI with text posts immediately
            const postsWithImagePlaceholders = newTextPosts.map(post => ({
                ...post,
                imageUrl: undefined,
            }));
            setResult(prev =>
                prev ? { ...prev, socialMediaPosts: postsWithImagePlaceholders } : null
            );

            // Step 3: Asynchronously generate images
            // (will simulate with placeholders if image generation is disabled)
            newTextPosts.forEach(async (post, index) => {
                try {
                    const prompt = `A professional, visually appealing graphic for a social media post about a podcast. The tone is "${socialMediaTone}". The post says: "${post.content}"`;
                    const imageUrl = await generateImage(prompt);
                    setResult(prev => {
                        if (!prev) return null;
                        const newPosts = [...prev.socialMediaPosts];
                        if (newPosts[index]) {
                            newPosts[index] = { ...newPosts[index], imageUrl };
                        }
                        return { ...prev, socialMediaPosts: newPosts };
                    });
                } catch (err) {
                    console.error(`Failed to regenerate image for post at index ${index}:`, err);
                }
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred.";
            setSocialMediaError(errorMessage);
            showErrorDialog(err);
            console.error(err);
        } finally {
            setIsRegeneratingSocialMedia(false);
        }
    };

    const handleGuideImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setEditGuideImage(file);
        }
    };

    const handleImageEdit = async (
        index: number,
        prompt: string,
        guideImageFile: File | null
    ) => {
        setIsEditingImage(true);
        setImageEditError(null);

        const originalImageUrl = result?.socialMediaPosts[index]?.imageUrl;
        if (!originalImageUrl) {
            setImageEditError("Original image not found.");
            setIsEditingImage(false);
            return;
        }

        try {
            const [meta, base64Data] = originalImageUrl.split(",");
            if (!(meta && base64Data)) throw new Error("Invalid image data URL format.");

            const mimeTypeMatch = meta.match(/:(.*?);/);
            if (!mimeTypeMatch?.[1]) throw new Error("Could not determine image MIME type.");
            const mimeType = mimeTypeMatch[1];

            let guideImage: { base64: string; mimeType: string } | undefined;
            if (guideImageFile) {
                const guideImageBase64 = await fileToBase64(guideImageFile);
                guideImage = {
                    base64: guideImageBase64,
                    mimeType: guideImageFile.type,
                };
            }

            const newImageUrl = await editImage(
                prompt,
                { base64: base64Data, mimeType: mimeType },
                guideImage
            );

            setResult(prev => {
                if (!prev) return null;
                const newPosts = [...prev.socialMediaPosts];
                newPosts[index] = { ...newPosts[index], imageUrl: newImageUrl };
                return { ...prev, socialMediaPosts: newPosts };
            });

            setEditingPostIndex(null);
            setEditPrompt("");
            setEditGuideImage(null);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred.";
            setImageEditError(`Edit failed: ${errorMessage}`);
            showErrorDialog(err);
            console.error(err);
        } finally {
            setIsEditingImage(false);
        }
    };

    const shouldShowChapters = result && editedChapters && editedChapters.length > 0;
    const shouldShowSocialMedia =
        result?.socialMediaPosts && result.socialMediaPosts.length > 0;

    const imageGenEnabled = isImageGenerationEnabled();

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-xl font-bold text-white">Podcast Content Repurposer</h2>
                        <div className="flex items-center gap-2">
                            {useLiteModel && (
                                <div className="px-3 py-1 bg-blue-900/20 border border-blue-700/50 rounded">
                                    <p className="text-blue-400 text-xs font-medium">
                                        ⚡ Fast Model Active
                                    </p>
                                </div>
                            )}
                            {!imageGenEnabled && (
                                <div className="px-3 py-1 bg-yellow-900/20 border border-yellow-700/50 rounded">
                                    <p className="text-yellow-400 text-xs font-medium">
                                        Simulated Image Generation
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {!(result || isLoading) && (
                        <>
                            <p className="text-gray-400 mb-4">
                                Paste your podcast transcript below. Our AI will generate a summary,
                                identify chapters, and create social media posts to promote your episode.
                            </p>
                            <Textarea
                                value={transcript}
                                onChange={e => setTranscript(e.target.value)}
                                placeholder="Paste your full podcast transcript here..."
                                className="w-full h-64 p-3 bg-gray-900/50 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                aria-label="Podcast transcript input"
                            />
                            <Button
                                onClick={handleAnalyze}
                                disabled={!transcript}
                                className="mt-4 w-full sm:w-auto">
                                Analyze Transcript
                            </Button>
                        </>
                    )}
                    {result && (
                        <div className="flex justify-end">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="w-full sm:w-auto">
                                Reset & Try Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader size="h-10 w-10" />
                    <p className="ml-4 text-lg text-gray-300">
                        {progress || "Analyzing content..."}
                    </p>
                </div>
            )}

            {error && (
                <Card>
                    <CardContent>
                        <p className="text-red-400 whitespace-pre-wrap" role="alert">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {result && !isLoading && (
                <div className="space-y-6">
                    {result.summary && (
                        <Card>
                            <CardContent>
                                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Summary</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{result.summary}</p>
                            </CardContent>
                        </Card>
                    )}

                    {shouldShowChapters && (
                        <Card>
                            <CardContent>
                                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Chapters</h3>
                                <div className="space-y-3">
                                    {editedChapters.map((chapter, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col sm:flex-row items-start sm:items-center text-gray-300 gap-2">
                                            <input
                                                type="text"
                                                value={chapter.timestamp}
                                                onChange={e =>
                                                    handleChapterChange(index, "timestamp", e.target.value)
                                                }
                                                className="font-mono bg-gray-700 px-2 py-1 rounded-md text-sm flex-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                aria-label={`Chapter ${index + 1} timestamp`}
                                            />
                                            <input
                                                type="text"
                                                value={chapter.title}
                                                onChange={e =>
                                                    handleChapterChange(index, "title", e.target.value)
                                                }
                                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-md p-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                aria-label={`Chapter ${index + 1} title`}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 border-t border-gray-700 pt-6">
                                    <label
                                        htmlFor="socialMediaTone"
                                        className="block text-sm font-medium text-gray-300 mb-2">
                                        Regenerate with a specific tone or audience
                                    </label>
                                    <input
                                        type="text"
                                        id="socialMediaTone"
                                        value={socialMediaTone}
                                        onChange={e => setSocialMediaTone(e.target.value)}
                                        placeholder="e.g., Casual and witty, for tech entrepreneurs..."
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        aria-label="Social media post tone and audience"
                                    />
                                    <Button
                                        onClick={handleRegenerateSocialMedia}
                                        isLoading={isRegeneratingSocialMedia}
                                        disabled={
                                            isRegeneratingSocialMedia ||
                                            !result.summary ||
                                            editedChapters.length === 0
                                        }
                                        className="mt-4 w-full sm:w-auto"
                                        variant="secondary">
                                        {isRegeneratingSocialMedia
                                            ? "Regenerating..."
                                            : "Regenerate Social Media Posts"}
                                    </Button>
                                </div>
                                {socialMediaError && (
                                    <p className="text-red-400 text-sm mt-2" role="alert">
                                        Regeneration failed: {socialMediaError}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {shouldShowSocialMedia && (
                        <Card>
                            <CardContent>
                                <h3 className="text-lg font-semibold text-indigo-400 mb-4">
                                    Social Media Previews
                                </h3>
                                <div className="space-y-8">
                                    {result.socialMediaPosts.map((post, index) => (
                                        <div key={index}>
                                            <SocialMediaPreview
                                                platform={post.platform}
                                                content={post.content}
                                                imageUrl={post.imageUrl}
                                            />
                                            {post.imageUrl && imageGenEnabled && (
                                                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                                    {editingPostIndex === index ? (
                                                        <div className="space-y-4">
                                                            <div>
                                                                <Label className="block text-sm font-medium text-gray-300 mb-1">
                                                                    Image Edit Prompt
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={editPrompt}
                                                                    onChange={e => setEditPrompt(e.target.value)}
                                                                    placeholder="e.g., Make the background blurry"
                                                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="block text-sm font-medium text-gray-300 mb-1">
                                                                    Style/Branding Image (Optional)
                                                                </Label>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleGuideImageChange}
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 pt-2">
                                                                <Button
                                                                    onClick={() =>
                                                                        handleImageEdit(index, editPrompt, editGuideImage)
                                                                    }
                                                                    isLoading={isEditingImage}
                                                                    disabled={isEditingImage || !editPrompt}
                                                                    variant="secondary">
                                                                    Apply Edits
                                                                </Button>
                                                                <Button
                                                                    onClick={() => {
                                                                        setEditingPostIndex(null);
                                                                        setEditGuideImage(null);
                                                                    }}
                                                                    variant="secondary"
                                                                    disabled={isEditingImage}>
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                            {imageEditError && (
                                                                <p className="text-red-400 text-sm mt-2" role="alert">
                                                                    {imageEditError}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => {
                                                                setEditingPostIndex(index);
                                                                setEditPrompt("");
                                                                setEditGuideImage(null);
                                                                setImageEditError(null);
                                                            }}
                                                            variant="secondary"
                                                            disabled={isEditingImage || editingPostIndex !== null}>
                                                            Edit Image
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Error Alert Dialog */}
            <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{errorDialogData?.icon}</span>
                            {errorDialogData?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {errorDialogData?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
                            <strong>What to do:</strong> {errorDialogData?.action}
                        </div>
                        {!useLiteModel && (
                            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-md">
                                <div className="text-sm text-blue-400">
                                    💡 <strong>Tip:</strong> Try using the faster model, which handles high demand better and may succeed when the standard model is overloaded.
                                </div>
                            </div>
                        )}
                        {useLiteModel && (
                            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-md">
                                <div className="text-sm text-amber-400">
                                    ℹ️ You're currently using the fast model. Click "Reset & Try Again" to return to the standard model.
                                </div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        {!useLiteModel && (
                            <Button
                                onClick={() => {
                                    setUseLiteModel(true);
                                    setErrorDialogOpen(false);
                                    // Retry the last operation with lite model
                                    setTimeout(() => {
                                        if (result) {
                                            // If there's a result, they were regenerating social media
                                            handleRegenerateSocialMedia();
                                        } else {
                                            // Otherwise, they were doing initial analysis
                                            handleAnalyze();
                                        }
                                    }, 100);
                                }}
                                variant="outline"
                                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                                Try with Fast Model ⚡
                            </Button>
                        )}
                        <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
