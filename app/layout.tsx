import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Providers } from "./providers";
import "./globals.css";

const _InterSans = Inter({ subsets: ["latin"] });
const _InterMono = Inter({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-inter-mono",
});
export const metadata: Metadata = {
    title: "PODSLICE.Ai Studio - AI-Powered Content for Podcast Creators",
    description:
        "Transform your podcast episodes into summaries, clips, and social content with ethical AI",
    generator: "v0.app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="icon" href="/icon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

                <link rel="manifest" href="/manifest.json" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Vend+Sans:wght@500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className={`${_InterSans.className} ${_InterMono.className} font-sans antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
