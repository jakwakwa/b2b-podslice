"use client";

import { Theme } from "@radix-ui/themes";
import { ThemeProvider, useTheme } from "next-themes";
import type React from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

function ThemedProviders({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Use resolvedTheme to get actual theme (system preference if theme is 'system')
    const actualTheme = mounted ? resolvedTheme || "dark" : "dark";

    return (
        <Theme
            accentColor={actualTheme === "dark" ? "teal" : "violet"}
            grayColor="slate"
            radius="medium"
            scaling="100%"
            appearance={actualTheme === "dark" ? "dark" : "light"}>
            <div className="py-18">
                {children}
            </div>

            <div className="bg-topgradient" />
        </Theme>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            // enableSystem={true}
            storageKey="theme">
            <ThemedProviders>{children}</ThemedProviders>
            <Toaster position="top-center" richColors />
        </ThemeProvider>
    );
}
