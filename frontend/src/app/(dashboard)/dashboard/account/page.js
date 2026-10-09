"use client";

import {useState} from "react";
import {
    Button, Card, FieldError, Form, Input, Label, Skeleton, TextField, toast, Typography,
} from "@heroui/react";
import {KeyRound, LogOut, Save} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useAccount, useUpdateAccount} from "@/queries/account";
import {useLogout, useRequestPasswordReset} from "@/queries/auth";
import {getApiErrorMessage} from "@/lib/utils";
import {formatDate} from "@/lib/orders";

export default function AccountPage() {
    const {data: account, isLoading, isError} = useAccount();
    const requestReset = useRequestPasswordReset();
    const logout = useLogout();

    const sendResetLink = () =>
        requestReset.mutate(
            {email: account.email},
            {
                onSuccess: () => toast.success("Check your inbox for a password reset link."),
                onError: (error) => toast.danger(getApiErrorMessage(error, "Could not send the reset link.")),
            }
        );

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Typography type="h2" className="text-2xl font-light tracking-tight">Account</Typography>
                <Typography type="body-sm" className="text-muted">
                    Manage your personal details and security.
                </Typography>
            </div>

            {isLoading && <Skeleton className="h-72 w-full rounded-xl"/>}

            {isError && (
                <Typography type="body-sm" className="text-danger">
                    We could not load your account. Please refresh the page.
                </Typography>
            )}

            {account && (
                <>
                    {/* Profile */}
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                            <div>
                                <Typography type="h3" className="text-lg font-medium">
                                    Personal details
                                </Typography>
                                {account.date_joined && (
                                    <Typography type="body-xs" className="text-muted">
                                        Member since {formatDate(account.date_joined)}
                                    </Typography>
                                )}
                            </div>
                            <ProfileForm account={account}/>
                        </Card.Content>
                    </Card>

                    {/* Security */}
                    <Card>
                        <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                            <div>
                                <Typography type="h3" className="text-lg font-medium">Password</Typography>
                                <Typography type="body-sm" className="text-muted">
                                    We will email {account.email} a link to choose a new password.
                                </Typography>
                            </div>
                            <Button variant="secondary" className="w-fit"
                                    isPending={requestReset.isPending}
                                    onPress={sendResetLink}>
                                <Icon icon={KeyRound} className="size-4"/>
                                Send reset link
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Session */}
                    <Card>
                        <Card.Content className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                            <div>
                                <Typography type="h3" className="text-lg font-medium">Sign out</Typography>
                                <Typography type="body-sm" className="text-muted">
                                    End your session on this device.
                                </Typography>
                            </div>
                            <Button variant="ghost" className="text-danger"
                                    isPending={logout.isPending}
                                    onPress={() => logout.mutate()}>
                                <Icon icon={LogOut} className="size-4"/>
                                Sign out
                            </Button>
                        </Card.Content>
                    </Card>
                </>
            )}
        </div>
    );
}

function ProfileForm({account}) {
    const update = useUpdateAccount();
    const [form, setForm] = useState({
        first_name: account.first_name ?? "",
        last_name: account.last_name ?? "",
    });

    const isChanged =
        form.first_name !== (account.first_name ?? "") || form.last_name !== (account.last_name ?? "");

    const handleChange = (value, name) => setForm((prev) => ({...prev, [name]: value}));

    const handleSubmit = (e) => {
        e.preventDefault();

        update.mutate(form, {
            onSuccess: () => toast.success("Your details were saved."),
            onError: (error) => toast.danger(getApiErrorMessage(error, "Could not save your details.")),
        });
    };

    return (
        <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField variant="secondary" name="first_name" value={form.first_name}
                           onChange={(value) => handleChange(value, "first_name")}>
                    <Label>First name</Label>
                    <Input autoComplete="given-name"/>
                    <FieldError/>
                </TextField>

                <TextField variant="secondary" name="last_name" value={form.last_name}
                           onChange={(value) => handleChange(value, "last_name")}>
                    <Label>Last name</Label>
                    <Input autoComplete="family-name"/>
                    <FieldError/>
                </TextField>
            </div>

            <TextField variant="secondary" name="email" type="email" value={account.email} isReadOnly>
                <Label>Email</Label>
                <Input/>
            </TextField>

            <Button type="submit" className="w-fit" isPending={update.isPending}
                    isDisabled={!isChanged || update.isPending}>
                <Icon icon={Save} className="size-4"/>
                Save changes
            </Button>
        </Form>
    );
}
