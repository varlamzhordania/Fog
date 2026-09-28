"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Button, Typography} from "@heroui/react";
import {AlertCircle, Eye, EyeOff, UserPlus} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import {useRegister} from "@/queries/auth";

const INPUT_CLASS =
    "w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow";

export default function RegisterPage() {
    const router = useRouter();
    const {mutate: register, isPending, error} = useRegister();

    const [form, setForm] = useState({
        email: "",
        username: "",
        password1: "",
        password2: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [clientError, setClientError] = useState("");

    const handleChange = (e) => {
        setClientError("");
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setClientError("");

        if (form.password1 !== form.password2) {
            setClientError("Passwords do not match.");
            return;
        }

        if (form.password1.length < 8) {
            setClientError("Password must be at least 8 characters.");
            return;
        }

        register(form, {
            onSuccess: () => router.push("/"),
        });
    };

    const displayError = clientError || error?.message;

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
                    Create your research account
                </Typography>
            </div>

            {/* Card */}
            <div className="rounded-xl border border-border bg-surface p-8">

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

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">
                            Email <span className="text-danger">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={INPUT_CLASS}
                        />
                    </div>

                    {/* Username */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">
                            Username{" "}
                            <span className="text-muted/50 normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="anonymous_researcher"
                            className={INPUT_CLASS}
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">
                            Password <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password1"
                                required
                                autoComplete="new-password"
                                value={form.password1}
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
                            Confirm Password <span className="text-danger">*</span>
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password2"
                            required
                            autoComplete="new-password"
                            value={form.password2}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            className={INPUT_CLASS}
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        isLoading={isPending}
                        isDisabled={isPending}
                        className="w-full gap-2 mt-1"
                    >
                        <Icon icon={UserPlus} className="size-4"/>
                        {isPending ? "Creating account..." : "Create Account"}
                    </Button>

                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border"/>
                    <Typography type="small" className="text-[10px] font-mono uppercase tracking-widest text-muted/50">
                        or
                    </Typography>
                    <div className="h-px flex-1 bg-border"/>
                </div>

                {/* Login link */}
                <Typography type="small" className="text-center text-xs text-muted">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-accent font-medium hover:underline underline-offset-2"
                    >
                        Sign in
                    </Link>
                </Typography>

            </div>

            {/* Privacy note */}
            <Typography type="small" className="mt-5 block text-center text-[10px] font-mono uppercase tracking-widest text-muted/40">
                We collect only what&apos;s needed — no tracking, no third-party sharing
            </Typography>

        </div>
    );
}
