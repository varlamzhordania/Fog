"use client";

import {useState} from "react";
import Link from "next/link";
import {Button, Typography} from "@heroui/react";
import {AlertCircle, ArrowLeft, CheckCircle, Mail} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import {useRequestPasswordReset} from "@/queries/auth";

const INPUT_CLASS =
    "w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow";

export default function PasswordResetPage() {
    const {mutate: requestReset, isPending, error, isSuccess} = useRequestPasswordReset();
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        requestReset({email});
    };

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
                    Reset your password
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
                                Check Your Email
                            </Typography>
                            <Typography type="body-sm" className="text-xs text-muted leading-relaxed">
                                If an account with <strong className="text-foreground">{email}</strong> exists,
                                we&apos;ve sent a password reset link. Check your inbox and spam folder.
                            </Typography>
                        </div>
                        <Typography type="small" className="text-xs text-muted/60">
                            The link expires in 24 hours.
                        </Typography>
                        <Link
                            href="/login"
                            className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:underline underline-offset-2"
                        >
                            <Icon icon={ArrowLeft} className="size-3.5"/>
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Description */}
                        <Typography type="body-sm" className="mb-6 text-xs text-muted leading-relaxed">
                            Enter the email address associated with your account and we&apos;ll send
                            you a link to reset your password.
                        </Typography>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3">
                                <Icon icon={AlertCircle} className="size-4 shrink-0 text-danger mt-0.5"/>
                                <Typography type="small" className="text-xs text-danger">
                                    {error.message}
                                </Typography>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
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
                                <Icon icon={Mail} className="size-4"/>
                                {isPending ? "Sending..." : "Send Reset Link"}
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
