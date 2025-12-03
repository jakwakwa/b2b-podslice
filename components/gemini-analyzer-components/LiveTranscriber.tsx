import { type Blob, GoogleGenAI, type LiveServerMessage, Modality } from "@google/genai";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function encode(bytes: Uint8Array) {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}


function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: "audio/pcm;rate=16000",
    };
}

interface LiveSession {
    sendRealtimeInput(input: { media: Blob }): void;
    close(): void;
}

export const LiveTranscriber: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const stopRecording = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                track.stop();
            });
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const startRecording = async () => {
        setIsRecording(true);
        setError(null);
        setTranscription("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            sessionPromiseRef.current = ai.live.connect({
                model: "gemini-2.5-flash-native-audio-preview-09-2025",
                callbacks: {
                    onopen: () => {
                        audioContextRef.current = new (
                            window.AudioContext || (window as unknown as Window & typeof globalThis).AudioContext
                        )({ sampleRate: 16000 });
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;

                        const scriptProcessor = audioContextRef.current.createScriptProcessor(
                            4096,
                            1,
                            1
                        );
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = audioProcessingEvent => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscription(prev => prev + text);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live API Error:", e);
                        setError(`An error occurred: ${e.message || "Unknown error"}`);
                        stopRecording();
                    },
                    onclose: (_e: CloseEvent) => {
                        console.log("Live API connection closed.");
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? `Failed to start recording: ${err.message}`
                    : "An unknown error occurred."
            );
            setIsRecording(false);
        }
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return (
        <Card>
            <h2 className="text-xl font-bold text-white mb-4">Live Audio Transcription</h2>
            <p className="text-gray-400 mb-6">
                Click "Start Recording" to begin transcribing audio from your microphone in
                real-time using Gemini Flash.
            </p>
            <div className="flex space-x-4 mb-4">
                <Button onClick={startRecording} disabled={isRecording} className="w-full">
                    Start Recording
                </Button>
                <Button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    variant="secondary"
                    className="w-full">
                    Stop Recording
                </Button>
            </div>

            {error && <p className="text-red-400 mb-4">Error: {error}</p>}

            <div className="w-full min-h-[200px] p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                <p className="text-gray-300 whitespace-pre-wrap">
                    {transcription || "Transcription will appear here..."}
                </p>
                {isRecording && (
                    <div className="animate-pulse text-indigo-400 mt-2">Recording...</div>
                )}
            </div>
        </Card>
    );
};
