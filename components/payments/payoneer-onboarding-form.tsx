"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

const onboardingSchema = z.object({
	legalName: z.string().min(2, "Legal name must be at least 2 characters"),
	entityType: z.enum(["INDIVIDUAL", "BUSINESS"], {
		errorMap: () => ({ message: "Please select entity type" }),
	}),
	email: z.string().email("Invalid email address"),
	phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
	country: z
		.string()
		.length(2, "Please use 2-letter ISO country code (e.g., US, ZA)"),
	addressLine1: z.string().min(5, "Address is required"),
	addressLine2: z.string().optional(),
	city: z.string().min(2, "City is required"),
	state: z.string().optional(),
	postalCode: z.string().min(3, "Postal code is required"),
	accountHolderName: z.string().min(2, "Account holder name is required"),
	bankAccountNumber: z.string().min(5, "Bank account number is required"),
	bankRoutingNumber: z.string().optional(),
	bankCode: z.string().optional(),
	businessName: z.string().optional(),
	businessRegistrationNumber: z.string().optional(),
});

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
		formState: { errors },
		setValue,
	} = useForm<OnboardingFormData>({
		resolver: zodResolver(onboardingSchema),
		mode: "onBlur",
	});

	const entityType = watch("entityType");

	async function onSubmit(data: OnboardingFormData) {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const response = await fetch(
				"/api/payments/payoneer/onboard",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(
					result.error || "Failed to complete onboarding"
				);
			}

			setSubmitSuccess(true);
			onSuccess?.(result.payeeId);
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
						<AlertDescription className="text-red-800">
							{submitError}
						</AlertDescription>
					</Alert>
				)}

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

				{/* Legal Name */}
				<div className="space-y-2">
					<Label htmlFor="legalName">Legal Name *</Label>
					<Input
						id="legalName"
						placeholder="Your full legal name"
						{...register("legalName")}
						error={!!errors.legalName}
					/>
					{errors.legalName && (
						<p className="text-sm text-red-500">
							{errors.legalName.message}
						</p>
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
					<Label htmlFor="email">Email Address *</Label>
					<Input
						id="email"
						type="email"
						placeholder="your@email.com"
						{...register("email")}
						error={!!errors.email}
					/>
					{errors.email && (
						<p className="text-sm text-red-500">
							{errors.email.message}
						</p>
					)}
				</div>

				{/* Phone Number */}
				<div className="space-y-2">
					<Label htmlFor="phoneNumber">Phone Number *</Label>
					<Input
						id="phoneNumber"
						type="tel"
						placeholder="+1 (555) 123-4567"
						{...register("phoneNumber")}
						error={!!errors.phoneNumber}
					/>
					{errors.phoneNumber && (
						<p className="text-sm text-red-500">
							{errors.phoneNumber.message}
						</p>
					)}
				</div>

				{/* Country */}
				<div className="space-y-2">
					<Label htmlFor="country">
						Country Code (ISO 2-letter) *
					</Label>
					<Input
						id="country"
						placeholder="ZA"
						maxLength={2}
						{...register("country")}
						error={!!errors.country}
					/>
					{errors.country && (
						<p className="text-sm text-red-500">
							{errors.country.message}
						</p>
					)}
				</div>

				{/* Address */}
				<div className="space-y-2">
					<Label htmlFor="addressLine1">Address Line 1 *</Label>
					<Input
						id="addressLine1"
						placeholder="123 Main Street"
						{...register("addressLine1")}
						error={!!errors.addressLine1}
					/>
					{errors.addressLine1 && (
						<p className="text-sm text-red-500">
							{errors.addressLine1.message}
						</p>
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
						<Label htmlFor="city">City *</Label>
						<Input
							id="city"
							placeholder="Cape Town"
							{...register("city")}
							error={!!errors.city}
						/>
						{errors.city && (
							<p className="text-sm text-red-500">
								{errors.city.message}
							</p>
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
					<Label htmlFor="postalCode">Postal Code *</Label>
					<Input
						id="postalCode"
						placeholder="8000"
						{...register("postalCode")}
						error={!!errors.postalCode}
					/>
					{errors.postalCode && (
						<p className="text-sm text-red-500">
							{errors.postalCode.message}
						</p>
					)}
				</div>

				{/* Bank Details */}
				<div className="border-t pt-6">
					<h3 className="mb-4 text-lg font-semibold">
						Bank Account Details
					</h3>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="accountHolderName">
								Account Holder Name *
							</Label>
							<Input
								id="accountHolderName"
								placeholder="Name on bank account"
								{...register("accountHolderName")}
								error={!!errors.accountHolderName}
							/>
							{errors.accountHolderName && (
								<p className="text-sm text-red-500">
									{errors.accountHolderName.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="bankAccountNumber">
								Bank Account Number *
							</Label>
							<Input
								id="bankAccountNumber"
								placeholder="Account number"
								{...register("bankAccountNumber")}
								error={!!errors.bankAccountNumber}
							/>
							{errors.bankAccountNumber && (
								<p className="text-sm text-red-500">
									{errors.bankAccountNumber.message}
								</p>
							)}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="bankRoutingNumber">
									Routing Number (optional)
								</Label>
								<Input
									id="bankRoutingNumber"
									placeholder="Routing number"
									{...register("bankRoutingNumber")}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="bankCode">
									Bank Code (optional)
								</Label>
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
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full"
					size="lg"
				>
					{isSubmitting ? "Completing onboarding..." : "Complete Onboarding"}
				</Button>
			</form>
		</Card>
	);
}
