import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center  px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            P
                        </div>
                        <span className="text-2xl font-bold">Podslice</span>
                    </Link>
                    <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
                    <p className="mt-2 text-muted-foreground">
                        Sign in to your account to continue
                    </p>
                </div>
                <SignInForm />
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {"Don't have an account? "}
                    <Link href="/sign-up" className="font-medium text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
