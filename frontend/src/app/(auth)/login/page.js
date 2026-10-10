"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {
    Link,
    Button,
    Card,
    Description,
    FieldError,
    Form,
    Input,
    Label, Separator,
    TextField, toast,
    Typography, InputGroup
} from "@heroui/react";
import {Eye, EyeOff, LogIn} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useLogin} from "@/queries/auth";
import {isInvalidEmail, validatePassword} from "@/lib/utils";
import {useAuthStore} from "@/stores/auth";
import {useCartStore} from "@/stores/cart";

export default function LoginPage() {
    const logged_in = useAuthStore((s) => s.logged_in)
    const router = useRouter();
    const {mutate: login, isPending} = useLogin();

    const [form, setForm] = useState({email: "", password: ""});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (value, name) => setForm((prev) => ({...prev, [name]: value}));


    const handleSubmit = (e) => {
        e.preventDefault();

        login(form, {
            onSuccess: async () => {
                try {
                    await useCartStore
                        .getState()
                        .syncGuestCart();
                } catch (error) {
                    // error
                }finally {
                    toast.success("Successfully logged in.");
                }
            },

            onError: (error) => {
                const description =
                    [400, 401].includes(error?.status) ? "Email or password is incorrect."
                    : error?.status === 429 ? "Too many attempts. Please wait a minute and try again."
                    : "We couldn't sign you in. Please try again.";

                const id = toast.danger("Login Failed", {
                    actionProps: {
                        children: "Dismiss",
                        onPress: () => toast.close(id),
                        variant: "tertiary",
                    },
                    description: description,
                });
            },
        });
    };

    useEffect(() => {
        if (logged_in) router.push("/")
    }, [logged_in]);

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
                <Typography type="body-sm" className="mt-1.5 block text-center">
                    Sign in to your account to continue shopping.
                </Typography>
            </div>

            <Card>
                <Card.Content className={"p-2"}>
                    <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <TextField
                            isRequired
                            variant={"secondary"}
                            name="email"
                            type="email"
                            validate={(value) => {
                                return isInvalidEmail(value) ? "Please enter a valid email address" : null
                            }}
                            value={form.email}
                            onChange={(value) => handleChange(value, "email")}
                        >
                            <Label>Email</Label>
                            <Input placeholder="john@example.com"/>
                            <FieldError/>
                        </TextField>

                        <TextField
                            isRequired
                            variant={"secondary"}
                            minLength={4}
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            // validate={(value) => validatePassword(value)}
                            value={form.password}
                            onChange={(value) => handleChange(value, "password")}
                        >
                            <div className={"flex justify-between items-center"}>
                                <Label>Password</Label>
                                <Link
                                    href="/password-reset"
                                    className="text-xs text-accent hover:underline underline-offset-2"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <InputGroup variant="secondary">
                                <InputGroup.Input placeholder="Enter your password"/>
                                <InputGroup.Suffix className={"pe-0"}>
                                    <Button isIconOnly variant={"ghost"}
                                            onPress={() => setShowPassword(prevState => !prevState)}>
                                        <Icon icon={showPassword ? Eye : EyeOff}/>
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
                            <Icon icon={LogIn} className="size-4"/>
                            {isPending ? "Signing in..." : "Sign In"}
                        </Button>

                    </Form>

                    <Separator orientation={"vertical"}/>


                    <Typography type="small" className="text-center text-xs text-muted">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="text-accent no-underline"
                        >
                            Create account
                        </Link>
                    </Typography>

                </Card.Content>
            </Card>
        </div>
    );
}
