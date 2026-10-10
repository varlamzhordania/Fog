"use client";

import {useState} from "react";
import {
    Button,
    Card,
    Description,
    FieldError,
    Form,
    Input,
    Label,
    Link,
    TextArea,
    TextField,
    toast,
    Typography,
} from "@heroui/react";
import {Clock, Mail, MessageSquare, Send} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useConfig, useCreateContact} from "@/queries/settings";

const buildChannels = (config) => [
    config?.SUPPORT_EMAIL && {
        icon: Mail,
        title: "Support Email",
        description:
            "For order questions, payment issues, refunds, account matters, and general support.",
        value: config.SUPPORT_EMAIL,
        href: `mailto:${config.SUPPORT_EMAIL}`,
        label: "Send Email",
    },
    config?.COMMUNITY_TELEGRAM_URL && {
        icon: MessageSquare,
        title: "Community Telegram",
        description:
            "Follow community discussions and announcements through the available Telegram channel.",
        value: config.COMMUNITY_TELEGRAM_URL,
        href: config.COMMUNITY_TELEGRAM_URL,
        label: "Open Telegram",
    },
].filter(Boolean);

export default function ContactPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const createContact = useCreateContact();
    const {data: config} = useConfig();

    const channels = buildChannels(config);

    const handleChange = (value, name) => {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        createContact.mutate(form, {
            onSuccess: () => {
                toast.success(
                    "Message sent successfully. Our support team will review your message and get back to you as soon as possible."
                );
                setForm({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                });
            },

            onError: (error) => {
                console.error("Contact form submission failed:", error);

                const id = toast.danger("Message Failed", {
                    actionProps: {
                        children: "Dismiss",
                        onPress: () => toast.close(id),
                        variant: "tertiary",
                    },
                    description:
                        "We could not send your message. Please try again.",
                });
            },
        });
    };

    return (
        <section className="container container-space">


            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted"
                >
                    Support / Contact
                </Typography>

                <Typography
                    type="h1"
                    className="mb-4 text-5xl uppercase tracking-tighter md:text-6xl"
                >
                    Get in Touch
                </Typography>

                <Typography
                    type="body"
                    className="max-w-2xl leading-relaxed text-muted"
                >
                    Have a question about a product, order, payment, shipping,
                    or the FOG project? Use one of the available support
                    channels below.
                </Typography>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">


                <Card>
                    <Card.Content className="p-5 sm:p-6">

                        <Typography
                            type="span"
                            className="mb-6 block font-mono text-xs uppercase tracking-widest text-muted"
                        >
                            Send a Message
                        </Typography>

                        <Form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-5"
                        >

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                <TextField
                                    name="name"
                                    variant="secondary"
                                    value={form.name}
                                    isRequired
                                    onChange={(value) =>
                                        handleChange(value, "name")
                                    }
                                >
                                    <Label>Name</Label>
                                    <Input placeholder="Your name"/>
                                    <FieldError/>
                                </TextField>

                                <TextField
                                    name="email"
                                    type="email"
                                    variant="secondary"
                                    value={form.email}
                                    isRequired
                                    onChange={(value) =>
                                        handleChange(value, "email")
                                    }
                                >
                                    <Label>Email</Label>

                                    <Input placeholder="you@example.com"/>
                                    <FieldError/>
                                </TextField>

                            </div>

                            <TextField
                                isRequired
                                name="subject"
                                variant="secondary"
                                value={form.subject}
                                onChange={(value) =>
                                    handleChange(value, "subject")
                                }
                            >
                                <Label>Subject</Label>

                                <Input
                                    placeholder="Order issue, payment question, general inquiry..."
                                />

                                <FieldError/>
                            </TextField>

                            <TextField
                                isRequired
                                name="message"
                                variant="secondary"
                                value={form.message}
                                onChange={(value) =>
                                    handleChange(value, "message")
                                }
                            >
                                <Label>Message</Label>

                                <TextArea
                                    placeholder="Describe your question or issue..."
                                    rows={7}
                                />

                                <Description>
                                    Please do not include passwords, wallet
                                    seed phrases, private keys, or complete
                                    payment credentials.
                                </Description>

                                <FieldError/>
                            </TextField>

                            <Button
                                type="submit"
                                isPending={createContact.isPending}
                                isDisabled={createContact.isPending}
                            >
                                <Icon icon={Send} className="size-4"/>

                                {createContact.isPending
                                    ? "Sending..."
                                    : "Send Message"}
                            </Button>

                        </Form>

                    </Card.Content>
                </Card>


                <div className="flex flex-col gap-4">

                    {channels.map((channel) => (
                        <Card key={channel.title}>
                            <Card.Content className="p-5">

                                <Icon
                                    icon={channel.icon}
                                    className="mb-3 size-5 text-accent"
                                />

                                <Typography
                                    type="h6"
                                    className="mb-2 text-sm font-semibold uppercase tracking-wider"
                                >
                                    {channel.title}
                                </Typography>

                                <Typography
                                    type="body-sm"
                                    className="mb-4 text-xs leading-relaxed text-muted"
                                >
                                    {channel.description}
                                </Typography>

                                <Link
                                    href={channel.href}
                                    target={
                                        channel.href.startsWith("http")
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel={
                                        channel.href.startsWith("http")
                                            ? "noreferrer"
                                            : undefined
                                    }
                                    className="break-all text-xs text-accent"
                                >
                                    {channel.value}
                                </Link>

                            </Card.Content>
                        </Card>
                    ))}

                    <Card>
                        <Card.Content className="p-5">

                            <Icon
                                icon={Clock}
                                className="mb-3 size-5 text-accent"
                            />

                            <Typography
                                type="h6"
                                className="mb-2 text-sm font-semibold uppercase tracking-wider"
                            >
                                Response Time
                            </Typography>

                            <Typography
                                type="body-sm"
                                className="text-xs leading-relaxed text-muted"
                            >
                                Response times can vary depending on the type
                                and volume of requests. For order-related
                                questions, include your order number whenever
                                possible.
                            </Typography>

                        </Card.Content>
                    </Card>

                </div>

            </div>


            <Card className="mt-8">
                <Card.Content className="p-5">
                    <Typography
                        type="small"
                        className="text-xs leading-relaxed text-muted/70"
                    >
                        Please do not send passwords, wallet seed phrases,
                        private keys, complete payment credentials, or other
                        sensitive security information through the contact form.
                    </Typography>
                </Card.Content>
            </Card>

        </section>
    );

}
