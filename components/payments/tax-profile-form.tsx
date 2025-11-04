"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

const taxProfileSchema = z.object({
	taxIdentifier: z.string().min(3, "Tax ID/registration number is required"),
	taxJurisdiction: z
		.string()
		.length(2, "Use 2-letter country code (e.g., ZA, US)"),
	entityType: z.enum(["INDIVIDUAL", "BUSINESS"], {
		errorMap: () => ({ message: "Please select entity type" }),
	}),
	agreedToTaxTerms: z
		.boolean()
		.refine((val) => val === true, "You must agree to tax terms"),
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
		formState: { errors },
	} = useForm<TaxProfileFormData>({
		resolver: zodResolver(taxProfileSchema),
		mode: "onBlur",
	});

	async function onSubmit(data: TaxProfileFormData) {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const response = await fetch(
				"/api/payments/payoneer/tax-profile",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

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
			const message =
				error instanceof Error ? error.message : "Unknown error";
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
						<AlertDescription className="text-red-800">
							{submitError}
						</AlertDescription>
					</Alert>
				)}

				<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
					<p className="text-sm text-blue-900">
						Please provide your tax information. This helps us comply with
						local tax regulations for royalty payouts.
					</p>
				</div>

				{/* Entity Type */}
				<div className="space-y-2">
					<Label htmlFor="entityType">Entity Type *</Label>
					<select
						id="entityType"
						{...register("entityType")}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						<option value="">Select entity type</option>
						<option value="INDIVIDUAL">Individual</option>
						<option value="BUSINESS">Business</option>
					</select>
					{errors.entityType && (
						<p className="text-sm text-red-500">
							{errors.entityType.message}
						</p>
					)}
				</div>

				{/* Tax Identifier */}
				<div className="space-y-2">
					<Label htmlFor="taxIdentifier">
						Tax ID / Registration Number *
					</Label>
					<Input
						id="taxIdentifier"
						placeholder="e.g., 1234567890 or your tax ID"
						{...register("taxIdentifier")}
						error={!!errors.taxIdentifier}
					/>
					<p className="text-xs text-muted-foreground">
						Your ID number (SSN for individuals, business registration for
						entities)
					</p>
					{errors.taxIdentifier && (
						<p className="text-sm text-red-500">
							{errors.taxIdentifier.message}
						</p>
					)}
				</div>

				{/* Tax Jurisdiction */}
				<div className="space-y-2">
					<Label htmlFor="taxJurisdiction">
						Tax Jurisdiction (Country Code) *
					</Label>
					<Input
						id="taxJurisdiction"
						placeholder="ZA"
						maxLength={2}
						{...register("taxJurisdiction")}
						error={!!errors.taxJurisdiction}
					/>
					<p className="text-xs text-muted-foreground">
						2-letter ISO country code where you pay taxes
					</p>
					{errors.taxJurisdiction && (
						<p className="text-sm text-red-500">
							{errors.taxJurisdiction.message}
						</p>
					)}
				</div>

				{/* Agreement Checkbox */}
				<div className="space-y-3">
					<div className="flex items-start gap-3">
						<Checkbox
							id="agreedToTaxTerms"
							{...register("agreedToTaxTerms")}
							className="mt-1"
						/>
						<Label
							htmlFor="agreedToTaxTerms"
							className="text-sm font-normal cursor-pointer"
						>
							I confirm that the tax information provided is accurate and complete. I
							understand that Podslice may be required to report this information to tax
							authorities. *
						</Label>
					</div>
					{errors.agreedToTaxTerms && (
						<p className="text-sm text-red-500">
							{errors.agreedToTaxTerms.message}
						</p>
					)}
				</div>

				{/* Submit */}
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full"
					size="lg"
				>
					{isSubmitting ? "Submitting..." : "Submit Tax Profile"}
				</Button>
			</form>
		</Card>
	);
}
