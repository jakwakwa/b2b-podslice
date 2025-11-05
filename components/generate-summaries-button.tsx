"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateSummariesButton() {
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        // TODO: Implement the generate all summaries function
        setLoading(false);
    }

    return (
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Summaries"}
        </Button>
    );
}
