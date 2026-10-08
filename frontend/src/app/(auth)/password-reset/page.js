"use client";

import {useState} from "react";
import Link from "next/link";
import {
    Button,
    Card,
    FieldError,
    Form,
    Input,
    Label,
    Separator,
    TextField,
    Typography,
} from "@heroui/react";
import {ArrowLeft, CheckCircle, Mail} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useRequestPasswordReset} from "@/queries/auth";
import {validateEmail} from "@/lib/utils";

export default function PasswordResetPage() {
    const {mutate: requestReset, isPending, isSuccess} = useRequestPasswordReset();
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
                                    className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
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
                                        Check Your Email
                                    </Typography>

                                    <Typography
                                        type="body-sm"
                                        className="text-xs leading-relaxed text-muted"
                                    >
                                        If an account with{" "}
                                        <strong className="text-foreground">
                                            {email}
                                        </strong>{" "}
                                        exists, we&apos;ve sent a password reset link.
                                        Check your inbox and spam folder.
                                    </Typography>
                                </div>

                                <Typography
                                    type="small"
                                    className="text-xs text-muted/60"
                                >
                                    The link expires in 24 hours.
                                </Typography>
                            </div>

                            <Separator orientation="vertical"/>

                            <Typography
                                type="small"
                                className="flex justify-center text-center text-xs text-muted"
                            >
                                <Link
                                    href="/login"
                                    className="flex items-center gap-1.5 text-accent font-medium hover:underline underline-offset-2"
                                >
                                    <Icon icon={ArrowLeft} className="size-3.5"/>
                                    Back to sign in
                                </Link>
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography
                                type="body-sm"
                                className="mb-6 text-xs leading-relaxed text-muted"
                            >
                                Enter the email address associated with your account
                                and we&apos;ll send you a link to reset your password.
                            </Typography>

                            {/*
                             * If your mutation exposes an error, you can display it
                             * through Form validation or a toast, matching RegisterPage.
                             */}
                            <Form
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-5"
                            >
                                <TextField
                                    isRequired
                                    variant="secondary"
                                    name="email"
                                    type="email"
                                    validate={(value) => {
                                        return validateEmail(value)
                                            ? "Please enter a valid email address"
                                            : null;
                                    }}
                                    value={email}
                                    onChange={setEmail}
                                >
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="john@example.com"
                                        autoComplete="email"
                                    />
                                    <FieldError/>
                                </TextField>

                                <Button
                                    type="submit"
                                    isPending={isPending}
                                    isDisabled={isPending}
                                    fullWidth
                                >
                                    <Icon icon={Mail} className="size-4"/>
                                    {isPending
                                        ? "Sending reset link..."
                                        : "Send Reset Link"}
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