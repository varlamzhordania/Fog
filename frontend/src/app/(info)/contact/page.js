"use client"

import {useState} from "react";
import {Button, Typography} from "@heroui/react";
import {CheckCircle, Clock, Mail, MessageSquare, Send} from "lucide-react";
import Icon from "@/components/icon/Icon";

const CHANNELS = [
    {
        icon: Mail,
        title: "Support Email",
        description: "For order issues, refund requests, and account matters.",
        value: "support@fogdirect.io",
        href: "mailto:support@fogdirect.io",
        label: "Send Email",
    },
    {
        icon: MessageSquare,
        title: "Community Telegram",
        description: "Join our research community for discussions, strain sharing, and announcements.",
        value: "t.me/fogdirect",
        href: "https://t.me/fogdirect",
        label: "Open Telegram",
    },
];

export default function ContactPage() {
    const [form, setForm] = useState({name: "", email: "", subject: "", message: ""});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate submission — replace with real API call when available
        await new Promise(r => setTimeout(r, 800));
        setLoading(false);
        setSubmitted(true);
    };

    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Support / Contact
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Get in Touch
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    Whether you have a question about an order, a research inquiry, or just want
                    to connect with the FOG community — we&apos;re reachable through multiple channels.
                </Typography>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

                {/* Contact form */}
                <div className="p-6 rounded-xl border border-border bg-surface">
                    <Typography
                        type="span"
                        className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block"
                    >
                        Send a Message
                    </Typography>

                    {submitted ? (
                        <div className="flex flex-col items-center gap-4 py-12 text-center">
                            <Icon icon={CheckCircle} className="size-10 text-success"/>
                            <Typography type="h4" className="text-lg font-semibold uppercase tracking-wide">
                                Message Received
                            </Typography>
                            <Typography type="body-sm" className="text-muted text-sm max-w-xs">
                                We&apos;ve received your message and will respond within 24–48 hours.
                                For urgent matters, use our Telegram channel.
                            </Typography>
                            <button
                                onClick={() => {setSubmitted(false); setForm({name:"",email:"",subject:"",message:""});}}
                                className="mt-2 text-xs text-accent underline underline-offset-2 hover:opacity-75 transition-opacity"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                        Name <span className="text-muted/50">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Anonymous"
                                        className="w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                        Email <span className="text-muted/50">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                    Subject <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="Order issue, research question, general inquiry..."
                                    className="w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-mono uppercase tracking-widest text-muted">
                                    Message <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Describe your issue or question in as much detail as possible..."
                                    className="w-full rounded-lg border border-field-border bg-field-background px-3.5 py-2.5 text-sm text-field-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-1 focus:ring-accent transition-shadow resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-1">
                                <Typography type="small" className="text-muted/60 text-xs">
                                    You may submit anonymously. No account required.
                                </Typography>
                                <Button
                                    type="submit"
                                    isLoading={loading}
                                    className="shrink-0 gap-2"
                                >
                                    <Icon icon={Send} className="size-4"/>
                                    Send Message
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-5">

                    {/* Channels */}
                    {CHANNELS.map((ch) => (
                        <div
                            key={ch.title}
                            className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <Icon icon={ch.icon} className="size-4 text-accent"/>
                                <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest">
                                    {ch.title}
                                </Typography>
                            </div>
                            <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                {ch.description}
                            </Typography>
                            <Typography type="small" className="text-xs font-mono text-accent/80">
                                {ch.value}
                            </Typography>
                            <a
                                href={ch.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold uppercase tracking-widest text-foreground border border-border rounded-lg px-4 py-2 text-center hover:border-accent hover:text-accent transition-colors"
                            >
                                {ch.label}
                            </a>
                        </div>
                    ))}

                    {/* Response time */}
                    <div className="p-5 rounded-xl border border-border bg-surface flex gap-3 items-start">
                        <Icon icon={Clock} className="size-4 text-muted shrink-0 mt-0.5"/>
                        <div>
                            <Typography type="h6" className="text-xs font-semibold uppercase tracking-widest mb-1">
                                Response Time
                            </Typography>
                            <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                Support messages are typically answered within <strong className="text-foreground">24–48 hours</strong>.
                                For faster responses, use our Telegram community.
                                We are not available on weekends for email support.
                            </Typography>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
