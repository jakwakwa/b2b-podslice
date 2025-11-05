import {
	type GenerateVideosOperation,
	GoogleGenAI,
	Modality,
	type Part,
	Type,
} from "@google/genai";
import type { AspectRatio, PodcastAnalysisResult } from "./db.types";

/**
 * Extracts a JSON string from a text response that might include markdown code fences
 * or other conversational text.
 * @param text The raw text response from the model.
 * @returns A string that is likely to be valid JSON.
 */
const extractJson = (text: string): string => {
	// First, try to find a JSON block enclosed in markdown fences
	const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
	if (jsonBlockMatch?.[1]) {
		return jsonBlockMatch[1];
	}

	// If no markdown block, find the first '{' or '[' and the last '}' or ']'
	// This is a greedy approach but should work for responses with a single JSON object.
	const firstBracket = text.indexOf("{");
	const firstSquare = text.indexOf("[");
	let start = -1;

	// Find the earliest start of a JSON object or array
	if (firstBracket === -1) {
		start = firstSquare;
	} else if (firstSquare === -1) {
		start = firstBracket;
	} else {
		start = Math.min(firstBracket, firstSquare);
	}

	if (start === -1) return text; // No JSON structure found, return original text

	const lastBracket = text.lastIndexOf("}");
	const lastSquare = text.lastIndexOf("]");
	const end = Math.max(lastBracket, lastSquare);

	if (end === -1) return text; // No closing bracket found

	return text.substring(start, end + 1);
};

const getAiClient = () => {
	if (!process.env.API_KEY) {
		throw new Error("API_KEY environment variable is not set");
	}
	return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzePodcastContent = async (
	transcript: string,
	onProgress: (message: string) => void
): Promise<Pick<PodcastAnalysisResult, "summary" | "chapters">> => {
	onProgress("Generating summary and chapters...");
	const ai = getAiClient();
	const response = await ai.models.generateContent({
		model: "gemini-2.5-pro",
		contents: `Analyze the following podcast transcript. Your main goal is to repurpose it into a summary and chapters.

Provide your response in JSON format.

Here are the tasks:
1.  **Summary:** Write a concise summary of the podcast episode. This is the most important part.
2.  **Chapters:** Identify distinct chapters or topic sections. Provide a timestamp and a descriptive title for each. If the transcript is too short or doesn't have clear sections, return an empty array for "chapters".

Transcript:
${transcript}`,
		config: {
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					summary: {
						type: Type.STRING,
						description: "A concise summary of the podcast episode.",
					},
					chapters: {
						type: Type.ARRAY,
						description: "A list of chapters with timestamps and descriptive titles.",
						items: {
							type: Type.OBJECT,
							properties: {
								timestamp: {
									type: Type.STRING,
									description: 'The start time of the chapter, e.g., "00:00:00".',
								},
								title: { type: Type.STRING, description: "The title of the chapter." },
							},
						},
					},
				},
			},
		},
	});

	const rawText = response.text?.trim() ?? "";
	const jsonString = extractJson(rawText);
	const analysisResult = JSON.parse(jsonString) as Pick<
		PodcastAnalysisResult,
		"summary" | "chapters"
	>;

	onProgress("Summary and chapters generated!");
	return analysisResult;
};

export const generateSocialMediaPosts = async (
	summary: string,
	chapters: { timestamp: string; title: string }[],
	tone?: string
): Promise<{ platform: string; content: string }[]> => {
	const ai = getAiClient();
	const chaptersText = chapters.map(c => `${c.timestamp} - ${c.title}`).join("\n");
	const toneInstruction = tone
		? `\n\nPlease tailor the posts for the following audience/tone: "${tone}".`
		: "";

	const response = await ai.models.generateContent({
		model: "gemini-2.5-pro",
		contents: `Given the following podcast summary and chapter breakdown, generate three unique social media posts (for Twitter, LinkedIn, and Instagram) that promote the podcast episode.

    Summary:
    ${summary}

    Chapters:
    ${chaptersText}
    ${toneInstruction}
    `,
		config: {
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.ARRAY,
				description: "A list of social media posts tailored for different platforms.",
				items: {
					type: Type.OBJECT,
					properties: {
						platform: {
							type: Type.STRING,
							description: 'The social media platform (e.g., "Twitter").',
						},
						content: { type: Type.STRING, description: "The content of the post." },
					},
				},
			},
		},
	});

	const rawText = response.text?.trim() ?? "";
	const jsonString = extractJson(rawText);
	const posts = JSON.parse(jsonString) as { platform: string; content: string }[];

	return posts;
};

// Fix: Add analyzeVideoFrames function to analyze video content with Gemini Pro.
export const analyzeVideoFrames = async (
	prompt: string,
	frames: string[]
): Promise<string> => {
	const ai = getAiClient();
	const imageParts: Part[] = frames.map(frame => ({
		inlineData: {
			mimeType: "image/jpeg",
			data: frame,
		},
	}));

	const response = await ai.models.generateContent({
		model: "gemini-2.5-pro",
		contents: { parts: [{ text: prompt }, ...imageParts] },
	});

	return response.text ?? "";
};

// Fix: Add generateVideoFromImage function to generate video from an image using the Veo model.
export const generateVideoFromImage = async (
	prompt: string,
	imageBase64: string,
	mimeType: string,
	aspectRatio: AspectRatio,
	onProgress: (message: string) => void
): Promise<string> => {
	onProgress("Initializing video generation with Veo...");
	const ai = getAiClient();

	let operation: GenerateVideosOperation | undefined;
	try {
		operation = await ai.models.generateVideos({
			model: "veo-3.1-fast-generate-preview",
			prompt: prompt,
			image: {
				imageBytes: imageBase64,
				mimeType: mimeType,
			},
			config: {
				numberOfVideos: 1,
				resolution: "720p",
				aspectRatio: aspectRatio,
			},
		});
	} catch (error) {
		console.error("Initial generateVideos call failed:", error);
		if (
			error instanceof Error &&
			error.message.includes("Requested entity was not found")
		) {
			throw new Error(
				"API key error: Your API key seems to be invalid. Please select a valid key to continue."
			);
		}
		throw error;
	}

	onProgress("Video generation in progress... this may take several minutes.");

	let pollCount = 0;
	while (operation && !operation.done) {
		pollCount++;
		onProgress(`Checking video status (attempt ${pollCount})...`);
		await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds
		try {
			operation = await ai.operations.getVideosOperation({ operation: operation });
		} catch (error) {
			console.error("Polling for video operation failed:", error);
			if (
				error instanceof Error &&
				error.message.includes("Requested entity was not found")
			) {
				throw new Error(
					"API key error: Your API key seems to be invalid. Please select a valid key to continue."
				);
			}
			throw error;
		}
	}

	if (!operation?.response?.generatedVideos?.[0]?.video?.uri) {
		throw new Error("Video generation failed to produce a valid video URI.");
	}

	onProgress("Video generated! Downloading...");

	const downloadLink = operation.response.generatedVideos[0].video.uri;
	const apiKey = process.env.API_KEY;
	if (!apiKey) {
		throw new Error("API_KEY environment variable not set for downloading video.");
	}
	const response = await fetch(`${downloadLink}&key=${apiKey}`);

	if (!response.ok) {
		throw new Error(`Failed to download video: ${response.statusText}`);
	}

	const blob = await response.blob();
	onProgress("Download complete!");
	return URL.createObjectURL(blob);
};

export const generateImage = async (prompt: string): Promise<string> => {
	const ai = getAiClient();
	const response = await ai.models.generateImages({
		model: "imagen-4.0-generate-001",
		prompt,
		config: {
			numberOfImages: 1,
			outputMimeType: "image/jpeg",
			aspectRatio: "1:1",
		},
	});

	if (response.generatedImages && response.generatedImages.length > 0) {
		const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes ?? "";
		return `data:image/jpeg;base64,${base64ImageBytes}`;
	}
	throw new Error("Image generation failed.");
};

export const editImage = async (
	prompt: string,
	originalImage: { base64: string; mimeType: string },
	guideImage?: { base64: string; mimeType: string }
): Promise<string> => {
	const ai = getAiClient();

	const parts: Part[] = [
		{
			inlineData: {
				data: originalImage.base64,
				mimeType: originalImage.mimeType,
			},
		},
		{ text: prompt },
	];

	if (guideImage) {
		parts.push({
			inlineData: {
				data: guideImage.base64,
				mimeType: guideImage.mimeType,
			},
		});
	}

	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash-image",
		contents: { parts },
		config: {
			responseModalities: [Modality.IMAGE],
		},
	});

	for (const part of response?.candidates?.[0]?.content?.parts ?? []) {
		if (part.inlineData) {
			const base64ImageBytes: string | undefined = part.inlineData.data;
			return `data:image/png;base64,${base64ImageBytes}`;
		}
	}

	throw new Error("Image editing failed. The model did not return an image.");
};
