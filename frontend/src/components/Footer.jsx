"use client"

import {Typography} from "@heroui/react";
import Link from "next/link";
import {useCategories} from "@/queries/inventory";
import {useConfig} from "@/queries/settings";
import Image from "next/image";
import {useThemeStore} from "@/stores/theme";

const Footer = () => {
    const {theme} = useThemeStore(state => state)
    const {data: config} = useConfig()
    const {data, isLoading} = useCategories({
        page_size: 4,
        is_featured: true
    })
    const logo = theme === 'dark' ? config.WEBSITE_SECONDARY_ICON : config.WEBSITE_PRIMARY_ICON

    const categories = isLoading ? [] : data?.results ?? []

    const shopLinks = [
        {
            label: "All Products",
            href: "/products/",
        },
        ...categories.map((item) => ({
            label: item.name,
            href: `/products/?category=${item.slug}`,
        })),
    ]

    const discoverLinks = [
        {
            label: "Research Policy",
            href: "/research/",
        },
        {
            label: "Mycology",
            href: "/mycology/",
        },
        {
            label: "About",
            href: "/about/",
        },
    ]

    const supportLinks = [
        {
            label: "Contact",
            href: "/contact/",
        },
        {
            label: "Shipping",
            href: "/shipping/",
        },
        {
            label: "FAQ",
            href: "/faq/",
        },
    ]

    return (
        <footer className="container">
            <div className={"border-t container-space pb-0"}>
                <div
                    className="grid grid-cols-1 gap-12 pb-14 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr] lg:gap-10">

                    <div className="flex max-w-sm flex-col gap-5">
                        <Link href="/" className="w-fit">
                            {logo && <Image unoptimized={true} src={logo} width={64} height={64}
                                            alt={"FOG LOGO"}
                                            className={"object-cover"}/>}
                            <Typography
                                type="h2"
                                className="text-3xl font-atomic font-bold uppercase tracking-tight"
                            >
                                fog direct
                            </Typography>
                        </Link>

                        <Typography
                            className="max-w-xs text-sm leading-6 opacity-65"
                        >
                            {config?.WEBSITE_TAGLINE ||
                                "Premium mycology research & laboratory supplies."}
                        </Typography>

                        <Typography
                            className="max-w-sm text-sm leading-6 opacity-50"
                        >
                            Independent research, documentation, and carefully
                            selected supplies for mycology enthusiasts and
                            researchers.
                        </Typography>

                        {/* Social */}
                        <div className="mt-2 flex flex-wrap items-center gap-5">
                            {config?.COMMUNITY_TELEGRAM_URL && (
                                <a
                                    href={config.COMMUNITY_TELEGRAM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium uppercase tracking-wide opacity-60 transition-opacity hover:opacity-100"
                                >
                                    Telegram
                                </a>
                            )}

                            {config?.COMMUNITY_DISCORD_URL && (
                                <a
                                    href={config.COMMUNITY_DISCORD_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium uppercase tracking-wide opacity-60 transition-opacity hover:opacity-100"
                                >
                                    Discord
                                </a>
                            )}

                            {config?.COMMUNITY_TWITTER_URL && (
                                <a
                                    href={config.COMMUNITY_TWITTER_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium uppercase tracking-wide opacity-60 transition-opacity hover:opacity-100"
                                >
                                    X
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Shop */}
                    <FooterColumn title="Shop">
                        {shopLinks.map((item) => (
                            <FooterLink
                                key={item.href}
                                href={item.href}
                            >
                                {item.label}
                            </FooterLink>
                        ))}
                    </FooterColumn>

                    {/* Discover */}
                    <FooterColumn title="Discover">
                        {discoverLinks.map((item) => (
                            <FooterLink
                                key={item.href}
                                href={item.href}
                            >
                                {item.label}
                            </FooterLink>
                        ))}
                    </FooterColumn>

                    {/* Support */}
                    <FooterColumn title="Support">
                        {supportLinks.map((item) => (
                            <FooterLink
                                key={item.href}
                                href={item.href}
                            >
                                {item.label}
                            </FooterLink>
                        ))}

                        {config?.SUPPORT_EMAIL && (
                            <li className="mt-2">
                                <a
                                    href={`mailto:${config.SUPPORT_EMAIL}`}
                                    className="text-sm font-thin break-all opacity-60 transition-opacity hover:opacity-100"
                                >
                                    {config.SUPPORT_EMAIL}
                                </a>
                            </li>
                        )}
                    </FooterColumn>

                </div>

                {/* Research disclaimer */}
                {config?.LEGAL_RESEARCH_DISCLAIMER && (
                    <div className="border-t border-default-200 py-8">
                        <div className="max-w-5xl">
                            <Typography
                                className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] opacity-50"
                            >
                                Research Disclaimer
                            </Typography>

                            <Typography
                                className="text-xs leading-5 opacity-45"
                            >
                                {config.LEGAL_RESEARCH_DISCLAIMER}
                            </Typography>
                        </div>
                    </div>
                )}

                {/* Bottom bar */}
                <div
                    className="flex flex-col gap-5 border-t border-default-200 py-7 sm:flex-row sm:items-center sm:justify-between">

                    <Typography className="text-xs opacity-50">
                        {config?.FOOTER_COPYRIGHT_TEXT ||
                            "© 2026 FOG Mycology Research Lab. All rights reserved."}
                    </Typography>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Link
                            href="/privacy"
                            className="text-xs opacity-50 transition-opacity hover:opacity-100"
                        >
                            Privacy
                        </Link>

                        <Link
                            href="/terms"
                            className="text-xs opacity-50 transition-opacity hover:opacity-100"
                        >
                            Terms
                        </Link>

                        <Link
                            href="/research-policy"
                            className="text-xs opacity-50 transition-opacity hover:opacity-100"
                        >
                            Research Policy
                        </Link>
                    </div>

                </div>


            </div>
        </footer>
    )
}


const FooterColumn = ({title, children}) => {
    return (
        <ul className="list-none flex flex-col gap-3">
            <li className="mb-2">
                <Typography
                    type="h4"
                    className="text-sm font-semibold uppercase tracking-[0.15em]"
                >
                    {title}
                </Typography>
            </li>

            {children}
        </ul>
    )
}


const FooterLink = ({href, children}) => {
    return (
        <li>
            <Link
                href={href}
                className="text-sm font-thin capitalize opacity-60 transition-opacity hover:opacity-100"
            >
                {children}
            </Link>
        </li>
    )
}


export default Footer