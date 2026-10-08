"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {
    Button,
    Card,
    Description,
    FieldError,
    Form,
    Input,
    Label, Separator,
    TextField,
    Typography,
    toast, InputGroup,
} from "@heroui/react";
import {Eye, EyeOff, UserPlus} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useRegister} from "@/queries/auth";
import {validateEmail, validatePassword} from "@/lib/utils";
import {useAuthStore} from "@/stores/auth";

export default function RegisterPage() {
    const router = useRouter();
    const {mutate: register, isPending, error} = useRegister();
    const {logged_in} = useAuthStore(state => state)

    const [form, setForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        password1: "",
        password2: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (value, name) => setForm((prev) => ({...prev, [name]: value}));

    const handleSubmit = (e) => {
        e.preventDefault();

        if (form.password1 !== form.password2) {
            toast.danger("Passwords do not match.");
            return;
        }

        if (form.password1.length < 8) {
            toast.danger("Password must be at least 8 characters.");
            return;
        }

        register(form, {
            onSuccess: () => toast.success("Your account created successfully."),
            onError: (error) => {
                const id = toast.danger("Register Failed", {
                    actionProps: {
                        children: "Dismiss",
                        onPress: () => toast.close(id),
                        variant: "tertiary",
                    },
                    description: error.message,
                })
            }
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
                                return validateEmail(value) ? "Please enter a valid email address" : null
                            }}
                            value={form.email}
                            onChange={(value) => handleChange(value, "email")}
                        >
                            <Label>Email</Label>
                            <Input placeholder="john@example.com"/>
                            <FieldError/>
                        </TextField>
                        <TextField
                            variant={"secondary"}
                            name="first_name"
                            type="text"
                            value={form.first_name}
                            onChange={(value) => handleChange(value, "first_name")}
                        >
                            <Label>First Name</Label>
                            <Input placeholder={"john"}/>
                            <FieldError/>
                        </TextField>

                        <TextField
                            variant={"secondary"}
                            name="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={(value) => handleChange(value, "last_name")}
                        >
                            <Label>Last Name</Label>
                            <Input placeholder={"doe"}/>
                            <FieldError/>
                        </TextField>

                        <TextField
                            isRequired
                            variant={"secondary"}
                            minLength={8}
                            name="password1"
                            type={showPassword ? 'text' : 'password'}
                            validate={(value) => validatePassword(value)}
                            value={form.password1}
                            onChange={(value) => handleChange(value, "password1")}
                        >
                            <div className={"flex justify-between items-center"}>
                                <Label>Password</Label>
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
                            <Description>
                                Must be at least 8 characters with 1 uppercase and 1 number
                            </Description>
                            <FieldError/>
                        </TextField>

                        <TextField
                            isRequired
                            variant={"secondary"}
                            minLength={8}
                            name="password2"
                            type={showPassword ? 'text' : 'password'}
                            validate={(value) => validatePassword(value)}
                            value={form.password2}
                            onChange={(value) => handleChange(value, "password2")}
                        >
                            <div className={"flex justify-between items-center"}>
                                <Label>Confirm Password</Label>
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
                            <Icon icon={UserPlus} className="size-4"/>
                            {isPending ? "Creating account..." : "Create Account"}
                        </Button>

                    </Form>

                    <Separator orientation={"vertical"}/>


                    <Typography type="small" className="text-center text-xs text-muted">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-accent font-medium hover:underline underline-offset-2"
                        >
                            Sign in
                        </Link>
                    </Typography>

                </Card.Content>
            </Card>
        </div>
    );
}
