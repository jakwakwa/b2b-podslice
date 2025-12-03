"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RoyaltyPayoutButtonProps {
    royaltyId: string;
    onSuccess?: () => void;
}

export function RoyaltyPayoutButton({ royaltyId, onSuccess }: RoyaltyPayoutButtonProps) {
    const [loading, setloading] = useState(false);

    async function handlePayout() {
        setloading(true);
        try {
            const response = await fetch(`/api/royalties/${royaltyId}/payout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to process payout");
            }

            toast.success("Payout processed", {
                description: `Transaction ID: ${result.payout.transactionId}`,
            });

            onSuccess?.();
            // Optionally refresh the page
            // window.location.reload();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error("Payout failed", {
                description: message,
            });
        } finally {
            setloading(false);
        }
    }

    return <Button size="sm" onClick={handlePayout} disabled={loading} className="w-full">
        {loading ? "Processing..." : "Process Payout"}
    </Button>;
}
