"use client";

import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import {
    Button,
    Card,
    FieldError,
    Form,
    Input,
    InputGroup,
    Label,
    Separator,
    TextField,
    Typography,
} from "@heroui/react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Eye,
    EyeOff,
    KeyRound,
} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useConfirmPasswordReset} from "@/queries/auth";
import {validatePassword} from "@/lib/utils";

export default function ResetConfirmForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    const {
        mutate: confirmReset,
        isPending,
        error,
        isSuccess,
    } = useConfirmPasswordReset();

    const [form, setForm] = useState({
        new_password1: "",
        new_password2: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [clientError, setClientError] = useState("");

    const handleChange = (value, name) => {
        setClientError("");
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
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
            {
                uid,
                token,
                ...form,
            },
            {
                onSuccess: () => {
                    setTimeout(() => router.push("/login"), 2000);
                },
            }
        );
    };

    const displayError = clientError || error?.message;

    // Missing link parameters
    if (!uid || !token) {
        return (
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <Typography
                            type="span"
                            className="font-atomic text-5xl uppercase tracking-tighter text-foreground"
                        >
                            FOG DIRECT
                        </Typography>
                    </Link>
                </div>

                <Card>
                    <Card.Content className="p-2">
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div
                                className="flex size-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10"
                            >
                                <Icon
                                    icon={AlertCircle}
                                    className="size-7 text-danger"
                                />
                            </div>

                            <div>
                                <Typography
                                    type="h6"
                                    className="mb-2 text-sm font-semibold uppercase tracking-wide"
                                >
                                    Invalid Reset Link
                                </Typography>

                                <Typography
                                    type="body-sm"
                                    className="text-xs leading-relaxed text-muted"
                                >
                                    This password reset link is invalid or has
                                    expired. Please request a new one.
                                </Typography>
                            </div>
                        </div>

                        <Separator orientation="vertical"/>

                        <Typography
                            type="small"
                            className="text-center text-xs text-muted"
                        >
                            <Link
                                href="/password-reset"
                                className="inline-flex items-center gap-1.5 text-accent font-medium hover:underline underline-offset-2"
                            >
                                <Icon icon={ArrowLeft} className="size-3.5"/>
                                Request new link
                            </Link>
                        </Typography>
                    </Card.Content>
                </Card>
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
                        FOG DIRECT
                    </Typography>
                </Link>
            </div>

            <Card>
                <Card.Content className="p-2">

                    {isSuccess ? (
                        <>
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <div
                                    className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10"
                                >
                                    <Icon
                                        icon={CheckCircle}
                                        className="size-7 text-success"
                                    />
                                </div>

                                <div>
                                    <Typography
                                        type="h6"
                                        className="mb-1 text-sm font-semibold uppercase tracking-wide"
                                    >
                                        Password Reset
                                    </Typography>

                                    <Typography
                                        type="body-sm"
                                        className="text-xs leading-relaxed text-muted"
                                    >
                                        Your password has been updated.
                                        Redirecting you to sign in...
                                    </Typography>
                                </div>

                                <Link
                                    href="/login"
                                    className="mt-2 flex items-center gap-1.5 text-xs text-accent font-medium hover:underline underline-offset-2"
                                >
                                    <Icon icon={ArrowLeft} className="size-3.5"/>
                                    Go to sign in
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <Typography
                                type="body-sm"
                                className="mb-6 text-xs leading-relaxed text-muted"
                            >
                                Choose a new password for your account. Make
                                sure it is at least 8 characters long.
                            </Typography>

                            {displayError && (
                                <div
                                    className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3"
                                >
                                    <Icon
                                        icon={AlertCircle}
                                        className="mt-0.5 size-4 shrink-0 text-danger"
                                    />

                                    <Typography
                                        type="small"
                                        className="text-xs text-danger"
                                    >
                                        {displayError}
                                    </Typography>
                                </div>
                            )}

                            <Form
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-5"
                            >
                                {/* New Password */}
                                <TextField
                                    isRequired
                                    variant="secondary"
                                    name="new_password1"
                                    type={showPassword ? "text" : "password"}
                                    minLength={8}
                                    value={form.new_password1}
                                    onChange={(value) =>
                                        handleChange(value, "new_password1")
                                    }
                                    validate={(value) => validatePassword(value)}
                                >
                                    <div className="flex items-center justify-between">
                                        <Label>New Password</Label>
                                    </div>

                                    <InputGroup variant="secondary">
                                        <InputGroup.Input
                                            placeholder="Enter your new password"
                                            autoComplete="new-password"
                                        />

                                        <InputGroup.Suffix className="pe-0">
                                            <Button
                                                type="button"
                                                isIconOnly
                                                variant="ghost"
                                                onPress={() =>
                                                    setShowPassword(
                                                        (prev) => !prev
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                <Icon
                                                    icon={
                                                        showPassword
                                                            ? Eye
                                                            : EyeOff
                                                    }
                                                />
                                            </Button>
                                        </InputGroup.Suffix>
                                    </InputGroup>

                                    <FieldError/>
                                </TextField>

                                {/* Confirm Password */}
                                <TextField
                                    isRequired
                                    variant="secondary"
                                    name="new_password2"
                                    type={showPassword ? "text" : "password"}
                                    minLength={8}
                                    value={form.new_password2}
                                    onChange={(value) =>
                                        handleChange(value, "new_password2")
                                    }
                                    validate={(value) =>
                                        validatePassword(value)
                                    }
                                >
                                    <Label>Confirm Password</Label>

                                    <InputGroup variant="secondary">
                                        <InputGroup.Input
                                            placeholder="Re-enter your new password"
                                            autoComplete="new-password"
                                        />

                                        <InputGroup.Suffix className="pe-0">
                                            <Button
                                                type="button"
                                                isIconOnly
                                                variant="ghost"
                                                onPress={() =>
                                                    setShowPassword(
                                                        (prev) => !prev
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                <Icon
                                                    icon={
                                                        showPassword
                                                            ? Eye
                                                            : EyeOff
                                                    }
                                                />
                                            </Button>
                                        </InputGroup.Suffix>
                                    </InputGroup>

                                    <FieldError/>
                                </TextField>

                                <Button
                                    type="submit"
                                    isPending={isPending}
                                    isDisabled={isPending}
                                    fullWidth
                                >
                                    <Icon
                                        icon={KeyRound}
                                        className="size-4"
                                    />
                                    {isPending
                                        ? "Resetting password..."
                                        : "Set New Password"}
                                </Button>
                            </Form>

                            <Separator orientation="vertical"/>

                            <Typography
                                type="small"
                                className="text-center text-xs text-muted"
                            >
                                Remember your password?{" "}
                                <Link
                                    href="/login"
                                    className="text-accent font-medium hover:underline underline-offset-2"
                                >
                                    Sign in
                                </Link>
                            </Typography>
                        </>
                    )}

                </Card.Content>
            </Card>
        </div>
    );
}
