import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PayoneerOnboardingForm } from "@/components/payments/payoneer-onboarding-form";
import { TaxProfileForm } from "@/components/payments/tax-profile-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Payout Settings",
    description: "Manage your Payoneer payout account and tax information",
};

export default async function PayoutSettingsPage() {
    const user = await requireAuth();

    if (user.role !== "admin") {
        redirect("/dashboard");
    }

    const org = await prisma.organizations.findUnique({
        where: { id: user.organization_id! },
        select: {
            id: true,
            name: true,
            payoneer_payee_id: true,
            payout_status: true,
            tax_form_status: true,
        },
    });

    if (!org) {
        redirect("/dashboard");
    }

    const isOnboarded = !!org.payoneer_payee_id;
    const taxFormSubmitted = org.tax_form_status === "SUBMITTED";
    const canProcessPayouts = isOnboarded && taxFormSubmitted;

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
                <p className="mt-2 text-muted-foreground">
                    Manage your Payoneer account and tax information for royalty payouts
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
                {/* Payoneer Status */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Payoneer Account</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {isOnboarded
                                    ? "Your Payoneer account is configured"
                                    : "Set up Payoneer to receive payouts"}
                            </p>
                        </div>
                        <Badge variant={isOnboarded ? "default" : "secondary"}>
                            {isOnboarded ? org.payout_status : "NOT CONFIGURED"}
                        </Badge>
                    </div>
                    {isOnboarded && (
                        <div className="mt-4 text-xs font-mono text-muted-foreground bg-(--beduk-4) p-2 rounded">
                            Payee ID: {org.payoneer_payee_id}
                        </div>
                    )}
                </Card>

                {/* Tax Status */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Tax Profile</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {taxFormSubmitted
                                    ? "Tax information on file"
                                    : "Submit tax information to enable payouts"}
                            </p>
                        </div>
                        <Badge variant={taxFormSubmitted ? "default" : "secondary"}>
                            {taxFormSubmitted ? "SUBMITTED" : "PENDING"}
                        </Badge>
                    </div>
                </Card>
            </div>

            {/* Payout Readiness */}
            {canProcessPayouts && (
                <Card className="p-6 mb-8 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-600" />
                        <p className="text-sm font-medium text-green-900">
                            You're all set! You can now process royalty payouts.
                        </p>
                    </div>
                </Card>
            )}

            {/* Forms Section */}
            <div className="space-y-8">
                {/* Payoneer Onboarding */}
                {!isOnboarded && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Step 1: Payoneer Onboarding</h2>
                        <p className="text-muted-foreground mb-6">
                            Complete your Payoneer account setup. You'll need to provide your business
                            details and bank account information.
                        </p>
                        <PayoneerOnboardingForm />
                    </div>
                )}

                {/* Tax Profile */}
                {isOnboarded && !taxFormSubmitted && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Step 2: Tax Information</h2>
                        <p className="text-muted-foreground mb-6">
                            Provide your tax identification information. This is required to process
                            royalty payouts in compliance with local regulations.
                        </p>
                        <TaxProfileForm />
                    </div>
                )}

                {/* Success State */}
                {canProcessPayouts && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">All Set!</h2>
                        <p className="text-muted-foreground mb-6">
                            Your payout account is fully configured. Visit your{" "}
                            <a
                                href="/dashboard/royalties"
                                className="font-semibold underline hover:text-foreground">
                                royalties page
                            </a>{" "}
                            to process payments for your content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
