"use client";

import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import {Button, Typography} from "@heroui/react";
import {AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import {useConfirmPasswordReset} from "@/queries/auth";

const INPUT_CLASS =
    "w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow";

export default function PasswordResetConfirmPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    const {mutate: confirmReset, isPending, error, isSuccess} = useConfirmPasswordReset();

    const [form, setForm] = useState({new_password1: "", new_password2: ""});
    const [showPassword, setShowPassword] = useState(false);
    const [clientError, setClientError] = useState("");

    const handleChange = (e) => {
        setClientError("");
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setClientError("");

        if (form.new_password1 !== form.new_password2) {
            setClientError("Passwords do not match.");
            return;
        }

        if (form.new_password1.length < 8) {
            setClientError("Password must be at least 8 characters.");
            return;
        }

        confirmReset(
            {uid, token, ...form},
            {onSuccess: () => setTimeout(() => router.push("/login"), 2000)}
        );
    };

    const displayError = clientError || error?.message;

    // Missing link parameters
    if (!uid || !token) {
        return (
            <div className="w-full max-w-md">
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex size-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
                            <Icon icon={AlertCircle} className="size-7 text-danger"/>
                        </div>
                    </div>
                    <Typography type="h6" className="mb-2 text-sm font-semibold uppercase tracking-wide">
                        Invalid Reset Link
                    </Typography>
                    <Typography type="body-sm" className="mb-6 text-xs text-muted leading-relaxed">
                        This password reset link is invalid or has expired.
                        Please request a new one.
                    </Typography>
                    <Link
                        href="/password-reset"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline underline-offset-2"
                    >
                        <Icon icon={ArrowLeft} className="size-3.5"/>
                        Request new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">

            {/* Brand */}
            <div className="mb-8 text-center">
                <Link href="/">
                    <Typography
                        type="span"
                        className="font-atomic text-5xl uppercase tracking-tighter text-foreground"
                    >
                        FOG
                    </Typography>
                </Link>
                <Typography type="body-sm" className="mt-1.5 block text-muted">
                    Set your new password
                </Typography>
            </div>

            {/* Card */}
            <div className="rounded-xl border border-border bg-surface p-8">

                {isSuccess ? (
                    /* Success state */
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
                            <Icon icon={CheckCircle} className="size-7 text-success"/>
                        </div>
                        <div>
                            <Typography type="h6" className="mb-1 text-sm font-semibold uppercase tracking-wide">
                                Password Reset
                            </Typography>
                            <Typography type="body-sm" className="text-xs text-muted leading-relaxed">
                                Your password has been updated. Redirecting you to sign in...
                            </Typography>
                        </div>
                        <Link
                            href="/login"
                            className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:underline underline-offset-2"
                        >
                            <Icon icon={ArrowLeft} className="size-3.5"/>
                            Go to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Error */}
                        {displayError && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3">
                                <Icon icon={AlertCircle} className="size-4 shrink-0 text-danger mt-0.5"/>
                                <Typography type="small" className="text-xs text-danger">
                                    {displayError}
                                </Typography>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                            {/* New Password */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="new_password1"
                                        required
                                        autoComplete="new-password"
                                        value={form.new_password1}
                                        onChange={handleChange}
                                        placeholder="Min. 8 characters"
                                        className={`${INPUT_CLASS} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-foreground transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <Icon icon={showPassword ? EyeOff : Eye} className="size-4"/>
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                    Confirm New Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="new_password2"
                                    required
                                    autoComplete="new-password"
                                    value={form.new_password2}
                                    onChange={handleChange}
                                    placeholder="Re-enter your new password"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                isLoading={isPending}
                                isDisabled={isPending}
                                className="w-full gap-2"
                            >
                                <Icon icon={KeyRound} className="size-4"/>
                                {isPending ? "Resetting..." : "Set New Password"}
                            </Button>

                        </form>

                        {/* Back to login */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                            >
                                <Icon icon={ArrowLeft} className="size-3.5"/>
                                Back to sign in
                            </Link>
                        </div>
                    </>
                )}

            </div>

        </div>
    );
}
