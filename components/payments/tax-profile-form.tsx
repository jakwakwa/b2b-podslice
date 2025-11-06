"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const taxProfileSchema = z.object({
    taxIdentifier: z.string().trim().min(3, "Tax ID/registration number is required"),
    taxJurisdiction: z
        .string()
        .trim()
        .toUpperCase()
        .length(2, "Use 2-letter country code (e.g., ZA, US)"),
    entityType: z.enum(["INDIVIDUAL", "BUSINESS"], {
        errorMap: () => ({ message: "Please select entity type" }),
    }),
    agreedToTaxTerms: z
        .boolean()
        .refine(val => val === true, "You must agree to tax terms"),
});

type TaxProfileFormData = z.infer<typeof taxProfileSchema>;

interface TaxProfileFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function TaxProfileForm({ onSuccess, onError }: TaxProfileFormProps = {}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitted },
    } = useForm<TaxProfileFormData>({
        resolver: zodResolver(taxProfileSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            entityType: "",
            taxIdentifier: "",
            taxJurisdiction: "",
            agreedToTaxTerms: false,
        },
    });

    async function onSubmit(data: TaxProfileFormData) {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch("/api/payments/payoneer/tax-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to save tax profile");
            }

            setSubmitSuccess(true);
            onSuccess?.();
            // Refresh the page to show updated status
            if (!onSuccess) {
                router.refresh();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setSubmitError(message);
            onError?.(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (submitSuccess) {
        return (
            <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                    Tax profile submitted successfully. You can now process payouts.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {submitError && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{submitError}</AlertDescription>
                    </Alert>
                )}

                {/* Validation Error Summary */}
                {isSubmitted && Object.keys(errors).length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                            <p className="font-semibold mb-2">Please fix the following errors:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.entries(errors).map(([field, error]) => {
                                    const message = error?.message
                                        ? String(error.message)
                                        : `Error in ${field}`;
                                    return (
                                        <li key={field} className="text-sm">
                                            {message}
                                        </li>
                                    );
                                })}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">
                        Please provide your tax information. This helps us comply with local tax
                        regulations for royalty payouts.
                    </p>
                </div>

                {/* Entity Type */}
                <div className="space-y-2">
                    <Label htmlFor="entityType" className={errors.entityType ? "text-red-600" : ""}>
                        Entity Type *
                    </Label>
                    <select
                        id="entityType"
                        {...register("entityType")}
                        aria-invalid={errors.entityType ? "true" : "false"}
                        className={`w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2 ${errors.entityType
                                ? "border-red-500 focus:ring-red-500"
                                : "border-input  focus:ring-ring"
                            }`}>
                        <option value="">Select entity type</option>
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="BUSINESS">Business</option>
                    </select>
                    {errors.entityType && (
                        <p className="text-sm font-medium text-red-600">
                            {errors.entityType.message}
                        </p>
                    )}
                </div>

                {/* Tax Identifier */}
                <div className="space-y-2">
                    <Label
                        htmlFor="taxIdentifier"
                        className={errors.taxIdentifier ? "text-red-600" : ""}>
                        Tax ID / Registration Number *
                    </Label>
                    <Input
                        id="taxIdentifier"
                        placeholder="e.g., 1234567890 or your tax ID"
                        {...register("taxIdentifier")}
                        aria-invalid={errors.taxIdentifier ? "true" : "false"}
                    />
                    <p className="text-xs text-muted-foreground">
                        Your ID number (SSN for individuals, business registration for entities)
                    </p>
                    {errors.taxIdentifier && (
                        <p className="text-sm font-medium text-red-600">
                            {errors.taxIdentifier.message}
                        </p>
                    )}
                </div>

                {/* Tax Jurisdiction */}
                <div className="space-y-2">
                    <Label
                        htmlFor="taxJurisdiction"
                        className={errors.taxJurisdiction ? "text-red-600" : ""}>
                        Tax Jurisdiction (Country Code) *
                    </Label>
                    <Input
                        id="taxJurisdiction"
                        placeholder="ZA"
                        maxLength={2}
                        {...register("taxJurisdiction")}
                        aria-invalid={errors.taxJurisdiction ? "true" : "false"}
                    />
                    <p className="text-xs text-muted-foreground">
                        2-letter ISO country code where you pay taxes
                    </p>
                    {errors.taxJurisdiction && (
                        <p className="text-sm font-medium text-red-600">
                            {errors.taxJurisdiction.message}
                        </p>
                    )}
                </div>

                {/* Agreement Checkbox */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Controller
                            name="agreedToTaxTerms"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="agreedToTaxTerms"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1"
                                    aria-invalid={errors.agreedToTaxTerms ? "true" : "false"}
                                />
                            )}
                        />
                        <Label
                            htmlFor="agreedToTaxTerms"
                            className={`text-sm font-normal cursor-pointer ${errors.agreedToTaxTerms ? "text-red-600" : ""}`}>
                            I confirm that the tax information provided is accurate and complete. I
                            understand that PODSLICE.Ai Studio may be required to report this
                            information to tax authorities. *
                        </Label>
                    </div>
                    {errors.agreedToTaxTerms && (
                        <p className="text-sm font-medium text-red-600">
                            {errors.agreedToTaxTerms.message}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? "Submitting..." : "Submit Tax Profile"}
                </Button>
            </form>
        </Card>
    );
}
