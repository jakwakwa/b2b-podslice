"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const onboardingSchema = z.object({
    entityType: z
        .string()
        .refine((val) => val === "INDIVIDUAL" || val === "BUSINESS", {
            message: "Please select an entity type",
        }),
    legalName: z
        .string()
        .trim()
        .min(2, "Legal name must be at least 2 characters"),
    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Invalid email address"),
    phoneNumber: z
        .string()
        .trim()
        .min(10, "Phone number must be at least 10 digits"),
    country: z
        .string()
        .trim()
        .toUpperCase()
        .length(2, "Please use 2-letter ISO country code (e.g., US, ZA)"),
    addressLine1: z
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters"),
    addressLine2: z.string().trim().optional().or(z.literal("")),
    city: z
        .string()
        .trim()
        .min(2, "City must be at least 2 characters"),
    state: z.string().trim().optional().or(z.literal("")),
    postalCode: z
        .string()
        .trim()
        .min(3, "Postal code must be at least 3 characters"),
    accountHolderName: z
        .string()
        .trim()
        .min(2, "Account holder name must be at least 2 characters"),
    bankAccountNumber: z
        .string()
        .trim()
        .min(5, "Bank account number must be at least 5 characters"),
    bankRoutingNumber: z.string().trim().optional().or(z.literal("")),
    bankCode: z.string().trim().optional().or(z.literal("")),
    businessName: z.string().trim().optional().or(z.literal("")),
    businessRegistrationNumber: z.string().trim().optional().or(z.literal("")),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface PayoneerOnboardingFormProps {
    onSuccess?: (payeeId: string) => void;
    onError?: (error: string) => void;
}

export function PayoneerOnboardingForm({
    onSuccess,
    onError,
}: PayoneerOnboardingFormProps = {}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitted },
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const entityType = watch("entityType");

    async function onSubmit(data: OnboardingFormData) {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch("/api/payments/payoneer/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to complete onboarding");
            }

            setSubmitSuccess(true);
            onSuccess?.(result.payeeId);
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
                    Payoneer onboarding completed successfully! Your account is now active.
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
                            <p className="font-semibold mb-2">
                                Please fix the following errors:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.entries(errors).map(([field, error]) => {
                                    const message = error?.message ? String(error.message) : `Error in ${field}`;
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

                {/* Entity Type */}
                <div className="space-y-2">
                    <Label htmlFor="entityType" className={errors.entityType ? "text-red-600" : ""}>
                        Entity Type *
                    </Label>
                    <select
                        id="entityType"
                        {...register("entityType")}
                        required
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
                        <p className="text-sm font-medium text-red-600">{errors.entityType.message}</p>
                    )}
                </div>

                {/* Legal Name */}
                <div className="space-y-2">
                    <Label htmlFor="legalName" className={errors.legalName ? "text-red-600" : ""}>
                        Legal Name *
                    </Label>
                    <Input
                        id="legalName"
                        placeholder="Full legal name"
                        {...register("legalName")}
                        required
                        aria-invalid={errors.legalName ? "true" : "false"}
                    />
                    {errors.legalName && (
                        <p className="text-sm font-medium text-red-600">{errors.legalName.message}</p>
                    )}
                </div>

                {/* Business Name (conditional) */}
                {entityType === "BUSINESS" && (
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                            id="businessName"
                            placeholder="Your business name"
                            {...register("businessName")}
                        />
                    </div>
                )}

                {/* Business Registration (conditional) */}
                {entityType === "BUSINESS" && (
                    <div className="space-y-2">
                        <Label htmlFor="businessRegistrationNumber">
                            Business Registration Number
                        </Label>
                        <Input
                            id="businessRegistrationNumber"
                            placeholder="Registration or tax ID"
                            {...register("businessRegistrationNumber")}
                        />
                    </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className={errors.email ? "text-red-600" : ""}>
                        Email Address *
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        {...register("email")}
                        required
                        aria-invalid={errors.email ? "true" : "false"}
                    />
                    {errors.email && (
                        <p className="text-sm font-medium text-red-600">{errors.email.message}</p>
                    )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className={errors.phoneNumber ? "text-red-600" : ""}>
                        Phone Number *
                    </Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        {...register("phoneNumber")}
                        required
                        minLength={10}
                        aria-invalid={errors.phoneNumber ? "true" : "false"}
                    />
                    {errors.phoneNumber && (
                        <p className="text-sm font-medium text-red-600">{errors.phoneNumber.message}</p>
                    )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                    <Label htmlFor="country" className={errors.country ? "text-red-600" : ""}>
                        Country Code (ISO 2-letter) *
                    </Label>
                    <Input
                        id="country"
                        placeholder="ZA"
                        maxLength={2}
                        minLength={2}
                        {...register("country")}
                        required
                        aria-invalid={errors.country ? "true" : "false"}
                    />
                    {errors.country && (
                        <p className="text-sm font-medium text-red-600">{errors.country.message}</p>
                    )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <Label htmlFor="addressLine1" className={errors.addressLine1 ? "text-red-600" : ""}>
                        Address Line 1 *
                    </Label>
                    <Input
                        id="addressLine1"
                        placeholder="123 Main Street"
                        {...register("addressLine1")}
                        required
                        minLength={5}
                        aria-invalid={errors.addressLine1 ? "true" : "false"}
                    />
                    {errors.addressLine1 && (
                        <p className="text-sm font-medium text-red-600">{errors.addressLine1.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                        id="addressLine2"
                        placeholder="Apartment, suite, etc."
                        {...register("addressLine2")}
                    />
                </div>

                {/* City */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city" className={errors.city ? "text-red-600" : ""}>
                            City *
                        </Label>
                        <Input
                            id="city"
                            placeholder="Cape Town"
                            {...register("city")}
                            required
                            minLength={2}
                            aria-invalid={errors.city ? "true" : "false"}
                        />
                        {errors.city && (
                            <p className="text-sm font-medium text-red-600">{errors.city.message}</p>
                        )}
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                            id="state"
                            placeholder="Western Cape"
                            {...register("state")}
                        />
                    </div>
                </div>

                {/* Postal Code */}
                <div className="space-y-2">
                    <Label htmlFor="postalCode" className={errors.postalCode ? "text-red-600" : ""}>
                        Postal Code *
                    </Label>
                    <Input
                        id="postalCode"
                        placeholder="8000"
                        {...register("postalCode")}
                        required
                        minLength={3}
                        aria-invalid={errors.postalCode ? "true" : "false"}
                    />
                    {errors.postalCode && (
                        <p className="text-sm font-medium text-red-600">{errors.postalCode.message}</p>
                    )}
                </div>

                {/* Bank Details */}
                <div className="border-t pt-6">
                    <h3 className="mb-4 text-lg font-semibold">Bank Account Details</h3>

                    <div className="mt-2 gap-3 flex flex-col">
                        <div className="space-y-2">
                            <Label htmlFor="accountHolderName" className={errors.accountHolderName ? "text-red-600" : ""}>
                                Account Holder Name *
                            </Label>
                            <Input
                                id="accountHolderName"
                                placeholder="Name on bank account"
                                {...register("accountHolderName")}
                                required
                                minLength={2}
                                aria-invalid={errors.accountHolderName ? "true" : "false"}
                            />
                            {errors.accountHolderName && (
                                <p className="text-sm font-medium text-red-600">{errors.accountHolderName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bankAccountNumber" className={errors.bankAccountNumber ? "text-red-600" : ""}>
                                Bank Account Number *
                            </Label>
                            <Input
                                id="bankAccountNumber"
                                placeholder="Account number"
                                {...register("bankAccountNumber")}
                                required
                                minLength={5}
                                aria-invalid={errors.bankAccountNumber ? "true" : "false"}
                            />
                            {errors.bankAccountNumber && (
                                <p className="text-sm font-medium text-red-600">{errors.bankAccountNumber.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankRoutingNumber">Routing Number (optional)</Label>
                                <Input
                                    id="bankRoutingNumber"
                                    placeholder="Routing number"
                                    {...register("bankRoutingNumber")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankCode">Bank Code (optional)</Label>
                                <Input
                                    id="bankCode"
                                    placeholder="Bank code"
                                    {...register("bankCode")}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? "Completing onboarding..." : "Complete Onboarding"}
                </Button>
            </form>
        </Card>
    );
}
