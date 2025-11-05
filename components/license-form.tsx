"use client";

import type React from "react";

import { useState } from "react";
import { signLicense } from "@/app/actions/licensing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type License = {
    id: string;
    license_type: string;
    tdm_opt_out: boolean;
};

export function LicenseForm({
    organizationId,
    userId,
    currentLicense,
}: {
    organizationId: string;
    userId: string;
    currentLicense?: License;
}) {
    const [licenseType, setLicenseType] = useState(
        currentLicense?.license_type || "b2b_only"
    );
    const [tdmOptOut, setTdmOptOut] = useState(currentLicense?.tdm_opt_out);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!agreed) {
            setError("You must agree to the terms to continue");
            return;
        }

        setError("");
        setLoading(true);

        const result = await signLicense({
            organizationId,
            userId,
            licenseType: licenseType as "b2b_only" | "b2b_b2c",
            tdmOptOut,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            window.location.reload();
        }
    }

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <Label>License Type</Label>
                    <RadioGroup value={licenseType} onValueChange={setLicenseType}>
                        <div className="flex items-start space-x-3 rounded-lg border p-4">
                            <RadioGroupItem value="b2b_only" id="b2b_only" />
                            <div className="flex-1">
                                <Label htmlFor="b2b_only" className="font-medium cursor-pointer">
                                    B2B Only
                                </Label>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Your generated content remains private to your organization. No public
                                    sharing on the Podslice platform.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 rounded-lg border p-4">
                            <RadioGroupItem value="b2b_b2c" id="b2b_b2c" />
                            <div className="flex-1">
                                <Label htmlFor="b2b_b2c" className="font-medium cursor-pointer">
                                    B2B + B2C
                                </Label>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Your generated content can appear on the public Podslice platform with
                                    full attribution. Earn additional royalties from public engagement.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    <Label>Additional Options</Label>
                    <div className="flex items-start space-x-3 rounded-lg border p-4">
                        <Checkbox
                            id="tdm_opt_out"
                            checked={tdmOptOut}
                            onCheckedChange={checked => setTdmOptOut(checked as boolean)}
                        />
                        <div className="flex-1">
                            <Label htmlFor="tdm_opt_out" className="font-medium cursor-pointer">
                                Opt out of Text and Data Mining (EU)
                            </Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Under EU regulations, you can opt out of having your content used for text
                                and data mining purposes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-[var(--beduk-4)] p-4">
                    <h4 className="font-medium">Key Terms</h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <li>• All generated content includes mandatory attribution</li>
                        <li>• You retain full ownership of your original podcast content</li>
                        <li>• Royalties are calculated based on content usage and engagement</li>
                        <li>• You can update your license type at any time</li>
                        <li>• Attribution links must remain functional and unmodified</li>
                    </ul>
                </div>

                <div className="flex items-start space-x-3">
                    <Checkbox
                        id="agree"
                        checked={agreed}
                        onCheckedChange={checked => setAgreed(checked as boolean)}
                    />
                    <Label htmlFor="agree" className="cursor-pointer text-sm leading-relaxed">
                        I agree to the Podslice Terms of Service and understand that all generated
                        content will include attribution to my original podcast episodes.
                    </Label>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Button type="submit" disabled={loading || !agreed} className="w-full">
                    {loading
                        ? "Processing..."
                        : currentLicense
                            ? "Update License"
                            : "Sign License Agreement"}
                </Button>
            </form>
        </Card>
    );
}
