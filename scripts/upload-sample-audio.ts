// scripts/upload-sample-audio.ts
import { put } from "@vercel/blob";
import { readFileSync } from "fs";

async function uploadAudio() {
	// Read a local audio file
	const audioFile = readFileSync("./public/seed-sample.mp3");

	const blob = await put("seed-data/sample-episode.mp3", audioFile, {
		access: "public",
		contentType: "audio/mpeg",
	});

	console.log("✅ Uploaded! URL:", blob.url);
	console.log("\n📋 Copy this URL and update prisma/seed.ts with it");
}

uploadAudio();
