"use client";

import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setloading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setloading(true);
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setloading(false);
            return;
        }

        if (password.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters" });
            setloading(false);
            return;
        }

        if (!token) {
            setMessage({ type: "error", text: "Invalid reset link" });
            setloading(false);
            return;
        }

        const result = await resetPassword(token, password);

        if (result.success) {
            setMessage({ type: "success", text: "Password reset successfully!" });
            setTimeout(() => router.push("/sign-in"), 2000);
        } else {
            setMessage({ type: "error", text: result.error || "Failed to reset password" });
        }

        setloading(false);
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="mt-2 gap-3 flex flex-col">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
